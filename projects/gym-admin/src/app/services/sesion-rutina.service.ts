import { Injectable, signal, WritableSignal, Signal, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';
import { SesionRutina, SesionRutinaStatus, Rutina, Ejercicio } from 'gym-library';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

/**
 * Servicio para gestionar sesiones de rutina como documentos independientes en Firestore
 */
@Injectable({ providedIn: 'root' })
export class SesionRutinaService {
  private readonly firestore = inject(FIRESTORE);

  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
  private readonly COLLECTION = 'sesiones-rutina';

  private readonly _sesiones = signal<SesionRutina[]>([]);
  private readonly _sesionesPorEntrenado = new Map<string, WritableSignal<SesionRutina[]>>();
  private isGlobalListenerInitialized = false;

  // inyección del servicio de rutina
  private readonly rutinaService: RutinaService = inject(RutinaService);
  private readonly ejercicioService: EjercicioService = inject(EjercicioService);

  constructor() { }

  /**
   * Ejecuta el callback en el contexto correcto (zona o inyección)
   */
  private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
    if (this.zoneRunner) {
      return this.zoneRunner.run(callback);
    }
    return runInInjectionContext(this.injector, callback as any);
  }

  /**
   * Normaliza y limpia la sesión antes de guardar
   */
  private normalizeSesionRutina(sesion: SesionRutina): any {
    const normalized: any = { ...sesion };

    // Convertir fechas a Timestamp de Firestore
    if (normalized.fechaInicio instanceof Date) {
      normalized.fechaInicio = Timestamp.fromDate(normalized.fechaInicio);
    }
    if (normalized.fechaFin instanceof Date) {
      normalized.fechaFin = Timestamp.fromDate(normalized.fechaFin);
    }
    if (normalized.fechaLeido instanceof Date) {
      normalized.fechaLeido = Timestamp.fromDate(normalized.fechaLeido);
    }

    // Eliminar cualquier campo undefined para evitar errores en Firestore
    Object.keys(normalized).forEach(key => {
      if (normalized[key] === undefined) {
        delete normalized[key];
      }
    });

    // Normalizar rutinaResumen si existe
    if (normalized.rutinaResumen) {
      normalized.rutinaResumen = { ...normalized.rutinaResumen };
      Object.keys(normalized.rutinaResumen).forEach(key => {
        if (normalized.rutinaResumen[key] === undefined) {
          delete normalized.rutinaResumen[key];
        }
      });

      // Normalizar ejercicios
      if (normalized.rutinaResumen.ejercicios) {
        normalized.rutinaResumen.ejercicios = normalized.rutinaResumen.ejercicios.map((ejercicio: any) => {
          const ej: any = { ...ejercicio };
          Object.keys(ej).forEach(key => {
            if (ej[key] === undefined) {
              delete ej[key];
            }
          });
          return ej;
        });
      }
    }

    return normalized;
  }

  /**
   * Revierte la normalización al recibir datos de Firestore
   */
  private mapFromFirestore(data: any): SesionRutina {
    const res = {
      ...data,
      fechaInicio: data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : data.fechaInicio,
      fechaFin: data.fechaFin instanceof Timestamp ? data.fechaFin.toDate() : data.fechaFin,
      fechaLeido: data.fechaLeido instanceof Timestamp ? data.fechaLeido.toDate() : data.fechaLeido
    } as any;

    // Exponer los ejercicios al primer nivel para que el esquema de gym-admin los encuentre
    if (res.rutinaResumen?.ejercicios) {
      res.ejercicios = res.rutinaResumen.ejercicios;
    }

    return res as SesionRutina;
  }

  /**
   * Inicializa el listener global para todas las sesiones
   */
  private initializeGlobalListener(): void {
    if (this.isGlobalListenerInitialized) return;

    try {
      const q = query(collection(this.firestore, this.COLLECTION));
      onSnapshot(q, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const sesiones = snapshot.docs.map(docSnap => this.mapFromFirestore({ id: docSnap.id, ...docSnap.data() }));
          this._sesiones.set(sesiones);
        });
      });
      this.isGlobalListenerInitialized = true;
    } catch (e) {
      console.warn('Error inicializando listener global de sesiones:', e);
    }
  }

  /**
   * Signal readonly con todas las sesiones
   */
  get sesiones(): Signal<SesionRutina[]> {
    if (!this.isGlobalListenerInitialized) {
      this.initializeGlobalListener();
    }
    return this._sesiones.asReadonly();
  }

  /**
   * Obtiene sesiones por entrenado
   */
  getSesionesPorEntrenado(entrenadoId: string): Signal<SesionRutina[]> {
    if (!this._sesionesPorEntrenado.has(entrenadoId)) {
      const sesionesSignal = signal<SesionRutina[]>([]);
      this._sesionesPorEntrenado.set(entrenadoId, sesionesSignal);

      const q = query(collection(this.firestore, this.COLLECTION), where('entrenadoId', '==', entrenadoId));
      onSnapshot(q, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const sesiones = snapshot.docs.map(docSnap => this.mapFromFirestore({ id: docSnap.id, ...docSnap.data() }));
          sesionesSignal.set(sesiones);
        });
      });
    }
    return this._sesionesPorEntrenado.get(entrenadoId)!.asReadonly();
  }

  /**
   * Inicializa sesión de rutina en base a un usuario y a una rutina asignada
   */
  async inicializarSesionRutina(entrenadoId: string, rutinaId: string): Promise<SesionRutina> {
    const rutinaSesion = await this.getRutinaById(rutinaId);

    if (!rutinaSesion) {
      throw new Error('Rutina no encontrada');
    }

    const nuevaSesion: SesionRutina = {
      id: this.generarIdUnico(),
      entrenadoId: entrenadoId,
      fechaInicio: new Date(),
      rutinaResumen: {
        id: rutinaSesion.id,
        nombre: rutinaSesion.nombre,
        ejercicios: await this.getEjerciciosByRutinaId(rutinaId)
      },
      status: SesionRutinaStatus.EN_PROGRESO,
      porcentajeCompletado: 0,
      completada: false
    };
    return nuevaSesion;
  }

  /**
   * Crea una nueva sesión de rutina
   */
  async crearSesion(sesion: SesionRutina): Promise<void> {
    return this.runInZone(async () => {
      const normalizedSesion = this.normalizeSesionRutina(sesion);
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await setDoc(ref, normalizedSesion);
    });
  }

  /**
   * Obtiene una rutina por su ID
   * @param rutinaId - ID de la rutina
   * @returns - La rutina correspondiente
   */
  async getRutinaById(rutinaId: string): Promise<Rutina> {
    // Función auxiliar para esperar
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Intentar obtener la rutina hasta 5 veces con delays crecientes
    for (let attempt = 1; attempt <= 5; attempt++) {
      // Primero verificar si la rutina ya está en la lista general
      const rutinasActuales = this.rutinaService.rutinas();
      const rutinaExistente = rutinasActuales.find(r => r.id === rutinaId);

      if (rutinaExistente) {
        return rutinaExistente;
      }

      // Esperar con delay creciente (100ms, 200ms, 400ms, 800ms, 1000ms)
      await wait(100 * Math.pow(2, attempt - 1));
    }

    // Si no se encontró después de todos los intentos, intentar obtenerla específicamente
    const rutinaSignal = this.rutinaService.getRutina(rutinaId);

    // Último intento esperando un poco más
    await wait(1000);
    const rutina = rutinaSignal();

    if (!rutina) {
      throw new Error(`Rutina no encontrada: ${rutinaId}`);
    }

    return rutina;
  }

  async getEjerciciosByRutinaId(rutinaId: string): Promise<Ejercicio[]> {
    const rutina = await this.getRutinaById(rutinaId);
    if (!rutina.ejerciciosIds) return [];
    const allEjercicios = this.ejercicioService.ejercicios();
    return allEjercicios.filter(e => rutina.ejerciciosIds!.includes(e.id));
  }

  /**
   * Actualiza una sesión existente
   */
  async actualizarSesion(sesion: SesionRutina): Promise<void> {
    return this.runInZone(async () => {
      const normalizedSesion = this.normalizeSesionRutina(sesion);
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await updateDoc(ref, { ...normalizedSesion });
    });
  }

  /**
   * Marca una sesión como completada
   */
  async completarSesion(sesion: SesionRutina, fechaFin: Date, duracion: number): Promise<void> {
    sesion.fechaFin = fechaFin;
    sesion.duracion = duracion;
    sesion.completada = true;
    sesion.status = SesionRutinaStatus.COMPLETADA;
    await this.actualizarSesion(sesion);
  }

  /**
   * Elimina una sesión
   */
  async eliminarSesion(id: string): Promise<void> {
    return this.runInZone(async () => {
      const ref = doc(this.firestore, this.COLLECTION, id);
      await deleteDoc(ref);
    });
  }

  generarIdUnico(): string {
    return crypto.randomUUID();
  }
}

