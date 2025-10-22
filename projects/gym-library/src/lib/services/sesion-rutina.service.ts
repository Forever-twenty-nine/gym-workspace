import { Injectable, signal, WritableSignal, Signal } from '@angular/core';
import { SesionRutina } from '../models/sesion-rutina.model';

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
  // Mapa de signals para sesiones por rutina
  private readonly rutinaSesionesSignals = new Map<string, WritableSignal<SesionRutina[]>>();
  // Mapa de signals para sesiones por entrenado
  private readonly entrenadoSesionesSignals = new Map<string, WritableSignal<SesionRutina[]>>();
  private firestoreAdapter?: ISesionRutinaFirestoreAdapter;

  constructor() {
    // La inicialización se hará cuando se configure el adaptador
  }

  /**
   * Configura el adaptador de Firestore
   */
  setFirestoreAdapter(adapter: ISesionRutinaFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
  }

  /**
   * Obtiene todas las sesiones de una rutina
   */
  getSesionesPorRutina(rutinaId: string): Signal<SesionRutina[]> {
    if (!this.rutinaSesionesSignals.has(rutinaId)) {
      const sesionesSignal = signal<SesionRutina[]>([]);
      this.rutinaSesionesSignals.set(rutinaId, sesionesSignal);
      
      if (this.firestoreAdapter) {
        this.firestoreAdapter.getSesionesPorRutina(rutinaId, (sesiones) => {
          sesionesSignal.set(sesiones);
        });
      }
    }
    return this.rutinaSesionesSignals.get(rutinaId)!.asReadonly();
  }

  /**
   * Obtiene todas las sesiones de un entrenado
   */
  getSesionesPorEntrenado(entrenadoId: string): Signal<SesionRutina[]> {
    if (!this.entrenadoSesionesSignals.has(entrenadoId)) {
      const sesionesSignal = signal<SesionRutina[]>([]);
      this.entrenadoSesionesSignals.set(entrenadoId, sesionesSignal);
      
      if (this.firestoreAdapter) {
        this.firestoreAdapter.getSesionesPorEntrenado(entrenadoId, (sesiones) => {
          sesionesSignal.set(sesiones);
        });
      }
    }
    return this.entrenadoSesionesSignals.get(entrenadoId)!.asReadonly();
  }

  /**
   * Crea una nueva sesión
   */
  async crearSesion(sesion: SesionRutina): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    await this.firestoreAdapter.save(sesion);
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
    // Primero obtener la sesión actual
    const sesionesSignal = Array.from(this.rutinaSesionesSignals.values())
      .find(signal => signal().some(s => s.id === id));
    
    if (sesionesSignal) {
      const sesion = sesionesSignal().find(s => s.id === id);
      if (sesion) {
        sesion.completada = true;
        sesion.fechaFin = fechaFin;
        sesion.duracion = duracion;
        await this.actualizarSesion(sesion);
      }
    }
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
}
