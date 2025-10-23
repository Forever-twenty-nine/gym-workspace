import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import { SesionRutina } from '../models/sesion-rutina.model';
import { SesionRutinaStatus } from '../enums/sesion-rutina-status.enum';
import { Rutina } from '../models/rutina.model';
import { RutinaService } from './rutina.service';
import { Ejercicio } from '../models/ejercicio.model';
import { EjercicioService } from './ejercicio.service';

export interface ISesionRutinaFirestoreAdapter {
  getSesionesPorEntrenado(entrenadoId: string, callback: (sesiones: SesionRutina[]) => void): void;
  getSesionesPorRutina(rutinaId: string, callback: (sesiones: SesionRutina[]) => void): void;
  save(sesion: SesionRutina): Promise<void>;
  update(sesion: SesionRutina): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Servicio para gestionar sesiones de rutina como documentos independientes en Firestore
 */
@Injectable({ providedIn: 'root' })
export class SesionRutinaService {

  private firestoreAdapter?: ISesionRutinaFirestoreAdapter;
  private readonly _sesionesPorEntrenado = new Map<string, WritableSignal<SesionRutina[]>>();

  // inyección del servicio de rutina
  private readonly rutinaService: RutinaService = inject(RutinaService);
  private readonly ejercicioService: EjercicioService = inject(EjercicioService);

  setFirestoreAdapter(adapter: ISesionRutinaFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
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
      if (this.firestoreAdapter) {
        this.firestoreAdapter.getSesionesPorEntrenado(entrenadoId, (sesiones) => {
          sesionesSignal.set(sesiones);
        });
      }
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    const normalizedSesion = this.normalizeSesionRutina(sesion);
    await this.firestoreAdapter.save(normalizedSesion);
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    const normalizedSesion = this.normalizeSesionRutina(sesion);
    await this.firestoreAdapter.update(normalizedSesion);
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    await this.firestoreAdapter.delete(id);
  }

  generarIdUnico(): string {
    return crypto.randomUUID();
  }
}
