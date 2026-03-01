import { Injectable, signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {

  Firestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import { EstadisticasEntrenado } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

/**
 * 📊 Servicio de gestión de Estadísticas de Entrenados
 * Maneja la lógica de negocio y el estado de las estadísticas directamente con Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class EstadisticasEntrenadoService {
  private readonly firestore = inject(FIRESTORE);
  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
  private readonly COLLECTION = 'estadisticas-entrenado';

  // 📊 Signals para el estado de las estadísticas
  private readonly _estadisticas = signal<Map<string, EstadisticasEntrenado>>(new Map());
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // 🔍 Signals públicos de solo lectura
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private unsubscribes = new Map<string, () => void>();

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
   * Obtiene las estadísticas de un entrenado específico
   * @param entrenadoId - ID del entrenado
   * @returns Signal con las estadísticas del entrenado
   */
  getEstadisticas(entrenadoId: string) {
    return computed(() => this._estadisticas().get(entrenadoId) || null);
  }

  /**
   * Inicializa el listener para las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   */
  initializeListener(entrenadoId: string): void {
    if (this.unsubscribes.has(entrenadoId)) {
      return; // Ya está inicializado
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
      const unsubscribe = onSnapshot(estadisticasRef, (docSnap: DocumentSnapshot) => {
        this.runInZone(() => {
          const current = this._estadisticas();
          const updated = new Map(current);
          if (docSnap.exists()) {
            updated.set(entrenadoId, this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
          } else {
            updated.delete(entrenadoId);
          }
          this._estadisticas.set(updated);
          this._loading.set(false);
          this._error.set(null);
        });
      }, (error) => {
        console.error('❌ Error en listener de estadísticas:', error);
        this._error.set('Error al cargar estadísticas');
        this._loading.set(false);
      });

      this.unsubscribes.set(entrenadoId, unsubscribe);
    } catch (error) {
      console.error('❌ Error al inicializar listener de estadísticas:', error);
      this._error.set('Error al inicializar estadísticas');
      this._loading.set(false);
    }
  }

  /**
   * Detiene el listener para las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   */
  stopListener(entrenadoId: string): void {
    const unsubscribe = this.unsubscribes.get(entrenadoId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribes.delete(entrenadoId);
    }
  }

  /**
   * Crea estadísticas iniciales para un entrenado
   * @param entrenadoId - ID del entrenado
   * @param estadisticas - Datos de las estadísticas
   */
  async createEstadisticas(entrenadoId: string, estadisticas: EstadisticasEntrenado): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const dataToSave = this.mapToFirestore(estadisticas);
        const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
        await setDoc(estadisticasRef, dataToSave);
      });
    } catch (error) {
      console.error('❌ Error al crear estadísticas:', error);
      this._error.set('Error al crear estadísticas');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Actualiza las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   * @param estadisticas - Datos actualizados de las estadísticas
   */
  async updateEstadisticas(entrenadoId: string, estadisticas: Partial<EstadisticasEntrenado>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const dataToSave = this.mapToFirestore(estadisticas);
        const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
        await updateDoc(estadisticasRef, dataToSave);
      });
    } catch (error) {
      console.error('❌ Error al actualizar estadísticas:', error);
      this._error.set('Error al actualizar estadísticas');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Elimina las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   */
  async deleteEstadisticas(entrenadoId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
        await deleteDoc(estadisticasRef);
        // Remover del estado local
        const current = this._estadisticas();
        const updated = new Map(current);
        updated.delete(entrenadoId);
        this._estadisticas.set(updated);
      });
    } catch (error) {
      console.error('❌ Error al eliminar estadísticas:', error);
      this._error.set('Error al eliminar estadísticas');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Crea estadísticas iniciales por defecto
   * @returns Estadísticas iniciales
   */
  crearEstadisticasIniciales(): EstadisticasEntrenado {
    return {
      totalRutinasCompletadas: 0,
      rachaActual: 0,
      mejorRacha: 0,
      nivel: 1,
      experiencia: 0,
      experienciaProximoNivel: 100
    };
  }

  /**
   * Calcula el nivel basado en la experiencia
   * @param experiencia - Experiencia acumulada
   * @returns Nivel calculado
   */
  calcularNivel(experiencia: number): number {
    // Lógica simple: cada 100 XP un nivel
    return Math.floor(experiencia / 100) + 1;
  }

  /**
   * Calcula la experiencia necesaria para el próximo nivel
   * @param nivel - Nivel actual
   * @returns Experiencia necesaria para el próximo nivel
   */
  calcularExperienciaProximoNivel(nivel: number): number {
    return nivel * 100;
  }

  private mapFromFirestore(data: any): EstadisticasEntrenado {
    return {
      totalRutinasCompletadas: data.totalRutinasCompletadas || 0,
      rachaActual: data.rachaActual || 0,
      mejorRacha: data.mejorRacha || 0,
      ultimaFechaEntrenamiento: data.ultimaFechaEntrenamiento instanceof Timestamp
        ? data.ultimaFechaEntrenamiento.toDate()
        : (data.ultimaFechaEntrenamiento ? new Date(data.ultimaFechaEntrenamiento) : undefined),
      nivel: data.nivel || 1,
      experiencia: data.experiencia || 0,
      experienciaProximoNivel: data.experienciaProximoNivel || 100
    };
  }

  private mapToFirestore(estadisticas: Partial<EstadisticasEntrenado>): any {
    const data: any = {};
    if (estadisticas.totalRutinasCompletadas !== undefined) data.totalRutinasCompletadas = estadisticas.totalRutinasCompletadas;
    if (estadisticas.rachaActual !== undefined) data.rachaActual = estadisticas.rachaActual;
    if (estadisticas.mejorRacha !== undefined) data.mejorRacha = estadisticas.mejorRacha;
    if (estadisticas.ultimaFechaEntrenamiento !== undefined) {
      data.ultimaFechaEntrenamiento = estadisticas.ultimaFechaEntrenamiento instanceof Date
        ? Timestamp.fromDate(estadisticas.ultimaFechaEntrenamiento)
        : (estadisticas.ultimaFechaEntrenamiento || null);
    }
    if (estadisticas.nivel !== undefined) data.nivel = estadisticas.nivel;
    if (estadisticas.experiencia !== undefined) data.experiencia = estadisticas.experiencia;
    if (estadisticas.experienciaProximoNivel !== undefined) data.experienciaProximoNivel = estadisticas.experienciaProximoNivel;
    return data;
  }
}
