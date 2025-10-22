import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import { SesionRutina } from '../models/sesion-rutina.model';
import { SesionRutinaStatus } from '../enums/sesion-rutina-status.enum';
import { Rutina } from '../models/rutina.model';
import { RutinaService } from './rutina.service';
import { Ejercicio } from '../models/ejercicio.model';

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

  // inyección del servicio de rutina
  private readonly rutinaService: RutinaService = inject(RutinaService);

  /**
   * Configura el adaptador de Firestore
   */
  setFirestoreAdapter(adapter: ISesionRutinaFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
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
      rutina: rutinaSesion,
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
    await this.firestoreAdapter.save(sesion);
  }

  /**
   * Obtiene una rutina por su ID
   * @param rutinaId - ID de la rutina
   * @returns - La rutina correspondiente
   */
  async getRutinaById(rutinaId: string): Promise<Rutina> {
    const rutinaSignal = this.rutinaService.getRutina(rutinaId);
    const rutina = rutinaSignal();
    if (!rutina) {
      throw new Error('Rutina no encontrada');
    }
    return rutina;
  }

  async getEjerciciosByRutinaId(rutinaId: string): Promise<Ejercicio[]> {

    const rutinas
    
  }

  /**
   * Actualiza una sesión existente
   */
  async actualizarSesion(sesion: SesionRutina): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    await this.firestoreAdapter.update(sesion);
  }

  /**
   * Marca una sesión como completada
   */
  async completarSesion(id: string, fechaFin: Date, duracion: number): Promise<void> {
    // Nota: Este método asume que tienes acceso a la sesión. En una implementación real,
    // podrías necesitar obtener la sesión primero o modificar para recibir la sesión completa.
    // Por simplicidad, se mantiene, pero considera refactorizar si es necesario.
    throw new Error('Método no implementado completamente. Necesita obtener la sesión primero.');
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
