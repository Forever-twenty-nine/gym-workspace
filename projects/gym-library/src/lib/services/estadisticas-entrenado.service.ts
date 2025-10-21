import { Injectable, signal, computed, inject, InjectionToken } from '@angular/core';
import { EstadisticasEntrenado } from '../models/estadisticas-entrenado.model';

/**
 * 📊 Interfaz del adaptador de Firestore para Estadísticas de Entrenados
 * Define los métodos que debe implementar cualquier adaptador de persistencia
 */
export interface IEstadisticasEntrenadoFirestoreAdapter {
  /**
   * 📥 Obtiene las estadísticas de un entrenado específico
   * @param entrenadoId - ID del entrenado
   * @param callback - Función que se ejecuta cuando los datos cambian
   */
  getEstadisticas(entrenadoId: string, callback: (estadisticas: EstadisticasEntrenado | null) => void): () => void;

  /**
   * ➕ Crea estadísticas iniciales para un entrenado
   * @param entrenadoId - ID del entrenado
   * @param estadisticas - Datos de las estadísticas
   */
  create(entrenadoId: string, estadisticas: EstadisticasEntrenado): Promise<void>;

  /**
   * ✏️ Actualiza las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   * @param estadisticas - Datos actualizados de las estadísticas
   */
  update(entrenadoId: string, estadisticas: Partial<EstadisticasEntrenado>): Promise<void>;

  /**
   * 🗑️ Elimina las estadísticas de un entrenado
   * @param entrenadoId - ID del entrenado
   */
  delete(entrenadoId: string): Promise<void>;
}

/**
 * 🔑 Token de inyección para el adaptador de Estadísticas de Entrenados
 */
export const ESTADISTICAS_ENTRENADO_FIRESTORE_ADAPTER = new InjectionToken<IEstadisticasEntrenadoFirestoreAdapter>('EstadisticasEntrenadoFirestoreAdapter');

/**
 * 📊 Servicio de gestión de Estadísticas de Entrenados
 * Maneja la lógica de negocio y el estado de las estadísticas usando signals de Angular
 */
@Injectable({
  providedIn: 'root'
})
export class EstadisticasEntrenadoService {
  private adapter = inject(ESTADISTICAS_ENTRENADO_FIRESTORE_ADAPTER);

  // 📊 Signals para el estado de las estadísticas
  private readonly _estadisticas = signal<Map<string, EstadisticasEntrenado>>(new Map());
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // 🔍 Signals públicos de solo lectura
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private unsubscribes = new Map<string, () => void>();

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
      const unsubscribe = this.adapter.getEstadisticas(entrenadoId, (estadisticas: EstadisticasEntrenado | null) => {
        const current = this._estadisticas();
        const updated = new Map(current);
        if (estadisticas) {
          updated.set(entrenadoId, estadisticas);
        } else {
          updated.delete(entrenadoId);
        }
        this._estadisticas.set(updated);
        this._loading.set(false);
        this._error.set(null);
      });

      this.unsubscribes.set(entrenadoId, unsubscribe);
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      this._error.set('Error al cargar estadísticas');
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
      await this.adapter.create(entrenadoId, estadisticas);
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
      await this.adapter.update(entrenadoId, estadisticas);
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
      await this.adapter.delete(entrenadoId);
      // Remover del estado local
      const current = this._estadisticas();
      const updated = new Map(current);
      updated.delete(entrenadoId);
      this._estadisticas.set(updated);
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
}