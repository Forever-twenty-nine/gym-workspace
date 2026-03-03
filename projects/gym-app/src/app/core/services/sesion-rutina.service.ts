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
  Timestamp,
  arrayUnion,
  arrayRemove,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { SesionRutina, SesionRutinaStatus, Rutina, Ejercicio } from 'gym-library';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

/**
 * Servicio para gestionar sesiones de rutina como documentos independientes en Firestore
 */
@Injectable({ providedIn: 'root' })
export class SesionRutinaService {
  private readonly firestore = inject(FIRESTORE);
  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
  private readonly COLLECTION = 'sesiones-rutina';

  private readonly _sesionesPorEntrenado = new Map<string, WritableSignal<SesionRutina[]>>();
  private _sesionesCompartidasSignal?: Signal<SesionRutina[]>;

  // inyección de servicios
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
   * Obtiene sesiones por entrenado
   */
  getSesionesPorEntrenado(entrenadoId: string): Signal<SesionRutina[]> {
    if (!this._sesionesPorEntrenado.has(entrenadoId)) {
      const sesionesSignal = signal<SesionRutina[]>([]);
      this._sesionesPorEntrenado.set(entrenadoId, sesionesSignal);

      const q = query(collection(this.firestore, this.COLLECTION), where('entrenadoId', '==', entrenadoId));
      onSnapshot(q, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const sesiones = snapshot.docs.map(d => this.mapFromFirestore({ ...d.data(), id: d.id }));
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
      const dataToSave = this.mapToFirestore(normalizedSesion);
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await setDoc(ref, dataToSave);
    });
  }

  /**
   * Obtiene una rutina por su ID
   */
  async getRutinaById(rutinaId: string): Promise<Rutina> {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= 5; attempt++) {
      const rutinasActuales = this.rutinaService.rutinas();
      const rutinaExistente = rutinasActuales.find(r => r.id === rutinaId);

      if (rutinaExistente) {
        return rutinaExistente;
      }
      await wait(100 * Math.pow(2, attempt - 1));
    }

    const rutinaSignal = this.rutinaService.getRutina(rutinaId);
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
      const dataToSave = this.mapToFirestore(normalizedSesion);
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await updateDoc(ref, dataToSave);
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

  /**
   * Actualiza el estado de compartir de una sesión consumida
   */
  async setCompartida(id: string, compartida: boolean, userName?: string, userPhoto?: string): Promise<void> {
    return this.runInZone(async () => {
      const ref = doc(this.firestore, this.COLLECTION, id);
      const data: any = {
        compartida,
        nombreUsuario: userName,
        fotoUsuario: userPhoto,
        fechaCompartida: compartida ? Timestamp.now() : null
      };
      await updateDoc(ref, data);
    });
  }

  /**
   * Obtiene todas las sesiones compartidas (Feed Social)
   */
  getSesionesCompartidas(): Signal<SesionRutina[]> {
    if (this._sesionesCompartidasSignal) {
      return this._sesionesCompartidasSignal;
    }

    const sesionesSignal = signal<SesionRutina[]>([]);
    const col = collection(this.firestore, this.COLLECTION);
    const q = query(col, where('compartida', '==', true));

    onSnapshot(q, (snapshot: QuerySnapshot) => {
      this.runInZone(() => {
        const sesiones = snapshot.docs.map(d => this.mapFromFirestore({ ...d.data(), id: d.id }));

        // Ordenar por fecha de compartida descendente
        sesiones.sort((a, b) => {
          const timeA = this.getSafeTime(a.fechaCompartida) || this.getSafeTime(a.fechaInicio) || 0;
          const timeB = this.getSafeTime(b.fechaCompartida) || this.getSafeTime(b.fechaInicio) || 0;
          return timeB - timeA;
        });

        sesionesSignal.set(sesiones);
      });
    });

    this._sesionesCompartidasSignal = sesionesSignal.asReadonly();
    return this._sesionesCompartidasSignal;
  }

  private getSafeTime(date: any): number {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime();
    if (typeof date === 'string' || typeof date === 'number') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
  }

  /**
   * Agrega un like a una sesión compartida
   */
  async addLike(sesionId: string, userId: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, sesionId);
    return this.runInZone(async () => {
      await updateDoc(ref, {
        likes: arrayUnion(userId)
      });
    });
  }

  /**
   * Elimina un like de una sesión compartida
   */
  async removeLike(sesionId: string, userId: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, sesionId);
    return this.runInZone(async () => {
      await updateDoc(ref, {
        likes: arrayRemove(userId)
      });
    });
  }

  generarIdUnico(): string {
    return crypto.randomUUID();
  }

  private mapToFirestore(sesion: SesionRutina): any {
    const data = { ...sesion } as any;
    if (data.fechaInicio instanceof Date) {
      data.fechaInicio = Timestamp.fromDate(data.fechaInicio);
    }
    if (data.fechaFin instanceof Date) {
      data.fechaFin = Timestamp.fromDate(data.fechaFin);
    }
    if (data.fechaCompartida instanceof Date) {
      data.fechaCompartida = Timestamp.fromDate(data.fechaCompartida);
    }
    return data;
  }

  private mapFromFirestore(data: any): SesionRutina {
    return {
      ...data,
      fechaInicio: data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : (data.fechaInicio ? new Date(data.fechaInicio) : new Date()),
      fechaFin: data.fechaFin instanceof Timestamp ? data.fechaFin.toDate() : (data.fechaFin ? new Date(data.fechaFin) : undefined),
      fechaCompartida: data.fechaCompartida instanceof Timestamp ? data.fechaCompartida.toDate() : (data.fechaCompartida ? new Date(data.fechaCompartida) : undefined),
      likes: data.likes || []
    } as SesionRutina;
  }
}

