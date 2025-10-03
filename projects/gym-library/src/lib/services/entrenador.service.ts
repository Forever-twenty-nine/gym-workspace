import { Injectable, signal, computed, inject, InjectionToken } from '@angular/core';
import { Entrenador } from '../models/entrenador.model';

/**
 * 🏋️‍♂️ Interfaz del adaptador de Firestore para Entrenadores
 * Define los métodos que debe implementar cualquier adaptador de persistencia
 */
export interface IEntrenadorFirestoreAdapter {
  /**
   * 📥 Obtiene todos los entrenadores y configura listeners en tiempo real
   * @param callback - Función que se ejecuta cuando los datos cambian
   */
  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void;
  
  /**
   * ➕ Crea un nuevo entrenador
   * @param entrenador - Datos del entrenador a crear
   * @returns Promise con el ID del entrenador creado
   */
  create(entrenador: Omit<Entrenador, 'id'>): Promise<string>;
  
  /**
   * 📄 Crea un nuevo entrenador con ID específico
   * @param id - ID específico del entrenador
   * @param entrenador - Datos del entrenador a crear
   */
  createWithId?(id: string, entrenador: Omit<Entrenador, 'id'>): Promise<void>;
  
  /**
   * ✏️ Actualiza un entrenador existente
   * @param id - ID del entrenador
   * @param entrenador - Datos actualizados del entrenador
   */
  update(id: string, entrenador: Partial<Entrenador>): Promise<void>;
  
  /**
   * 🗑️ Elimina un entrenador
   * @param id - ID del entrenador a eliminar
   */
  delete(id: string): Promise<void>;
}

/**
 * 🔑 Token de inyección para el adaptador de Entrenadores
 */
export const ENTRENADOR_FIRESTORE_ADAPTER = new InjectionToken<IEntrenadorFirestoreAdapter>('EntrenadorFirestoreAdapter');

/**
 * 🏋️‍♂️ Servicio de gestión de Entrenadores
 * Maneja la lógica de negocio y el estado de los entrenadores usando signals de Angular
 */
@Injectable({
  providedIn: 'root'
})
export class EntrenadorService {
  private adapter = inject(ENTRENADOR_FIRESTORE_ADAPTER);
  
  // 📊 Signals para el estado de los entrenadores
  private readonly _entrenadores = signal<Entrenador[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // 🔍 Signals públicos de solo lectura
  readonly entrenadores = this._entrenadores.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // 📈 Signals computed para estadísticas
  readonly totalEntrenadores = computed(() => this._entrenadores().length);
  readonly entrenadoresActivos = computed(() => 
    this._entrenadores().filter(e => e.activo).length
  );
  readonly entrenadoresInactivos = computed(() => 
    this._entrenadores().filter(e => !e.activo).length
  );
  
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    this.loadEntrenadores();
  }
  
  /**
   * 📥 Carga inicial de entrenadores con listener en tiempo real
   */
  private loadEntrenadores(): void {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      this.unsubscribe = this.adapter.getEntrenadores((entrenadores: Entrenador[]) => {
        this._entrenadores.set(entrenadores);
        this._loading.set(false);
        this._error.set(null);
      });
    } catch (error) {
      console.error('❌ Error al cargar entrenadores:', error);
      this._error.set('Error al cargar entrenadores');
      this._loading.set(false);
    }
  }
  
  /**
   * ➕ Crea un nuevo entrenador
   * @param entrenadorData - Datos del entrenador a crear
   * @returns Promise con el ID del entrenador creado
   */
  async create(entrenadorData: Omit<Entrenador, 'id'>): Promise<string> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const id = await this.adapter.create(entrenadorData);
      console.log('✅ Entrenador creado:', id);
      return id;
    } catch (error) {
      console.error('❌ Error al crear entrenador:', error);
      this._error.set('Error al crear entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 📄 Crea un nuevo entrenador con ID específico
   * @param id - ID específico del entrenador (igual al uid del usuario)
   * @param entrenadorData - Datos del entrenador a crear
   */
  async createWithId(id: string, entrenadorData: Omit<Entrenador, 'id'>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      if (this.adapter.createWithId) {
        await this.adapter.createWithId(id, entrenadorData);
        console.log('✅ Entrenador creado con ID específico:', id);
      } else {
        throw new Error('El adaptador no soporta createWithId');
      }
    } catch (error) {
      console.error('❌ Error al crear entrenador con ID:', error);
      this._error.set('Error al crear entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * ✏️ Actualiza un entrenador existente
   * @param id - ID del entrenador
   * @param entrenadorData - Datos actualizados del entrenador
   */
  async update(id: string, entrenadorData: Partial<Entrenador>): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      await this.adapter.update(id, entrenadorData);
      console.log('✅ Entrenador actualizado:', id);
    } catch (error) {
      console.error('❌ Error al actualizar entrenador:', error);
      this._error.set('Error al actualizar entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * 🗑️ Elimina un entrenador
   * @param id - ID del entrenador a eliminar
   */
  async delete(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      await this.adapter.delete(id);
      console.log('✅ Entrenador eliminado:', id);
    } catch (error) {
      console.error('❌ Error al eliminar entrenador:', error);
      this._error.set('Error al eliminar entrenador');
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * 🔍 Busca un entrenador por ID
   * @param id - ID del entrenador
   * @returns Signal con el entrenador encontrado o undefined
   */
  getEntrenadorById(id: string) {
    return computed(() => 
      this._entrenadores().find(entrenador => entrenador.id === id)
    );
  }
  
  /**
   * 🏋️‍♂️ Busca entrenadores por gimnasio
   * @param gimnasioId - ID del gimnasio
   * @returns Signal con los entrenadores del gimnasio
   */
  getEntrenadoresByGimnasio(gimnasioId: string) {
    return computed(() => 
      this._entrenadores().filter(entrenador => 
        entrenador.gimnasioId === gimnasioId
      )
    );
  }
  
  /**
   * 🧹 Limpia los recursos del servicio
   */
  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}