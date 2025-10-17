import { Injectable, signal, computed, inject, InjectionToken } from '@angular/core';
import { Entrenador } from '../models/entrenador.model';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';
import { NotificacionService } from './notificacion.service';
import { MensajeService } from './mensaje.service';
import { Ejercicio } from '../models/ejercicio.model';

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
   * 👤 Suscribe a cambios en un entrenador específico
   * @param id - ID del entrenador
   * @param callback - Función que se ejecuta cuando el entrenador cambia
   */
  subscribeToEntrenador(id: string, callback: (entrenador: Entrenador | null) => void): void;
  
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
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);
  private notificacionService = inject(NotificacionService);
  private mensajeService = inject(MensajeService);
  
  // 📊 Signals para el estado de los entrenadores
  private readonly _entrenadores = signal<Entrenador[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // 🔍 Signals públicos de solo lectura
  readonly entrenadores = this._entrenadores.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  private unsubscribe: (() => void) | null = null;
  private isListenerInitialized = false;
  
  constructor() {
    // No cargar automáticamente, se hará manualmente cuando sea necesario
  }
  
  /**
   * 📥 Inicializa el listener de entrenadores (llamar manualmente cuando sea necesario)
   */
  initializeListener(): void {
    if (!this.isListenerInitialized) {
      this.loadEntrenadores();
      this.isListenerInitialized = true;
    }
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
      } else {
        throw new Error('El adaptador no soporta createWithId');
      }
    } catch (error) {
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
   * 📋 Obtiene las rutinas de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de rutinas del entrenador
   */
  getRutinasByEntrenador(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      if (!entrenador) return [];
      return this.rutinaService.rutinas().filter(rutina => entrenador.rutinasCreadasIds.includes(rutina.id));
    });
  }
  
  /**
   * 📋 Obtiene los ejercicios de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de ejercicios del entrenador
   */
  getEjerciciosByEntrenador(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      if (!entrenador) return [];
      return this.ejercicioService.ejercicios().filter((ejercicio: Ejercicio) => entrenador.ejerciciosCreadasIds.includes(ejercicio.id));
    });
  }
  
  /**
   * 📨 Obtiene las invitaciones de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de invitaciones del entrenador
   */
  getInvitacionesByEntrenador(entrenadorId: string) {
    return this.notificacionService.getInvitacionesPorEntrenador(entrenadorId);
  }
  
  /**
   * 💬 Obtiene los mensajes de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de mensajes del entrenador
   */
  getMensajesByEntrenador(entrenadorId: string) {
    return this.mensajeService.getMensajesByEntrenador(entrenadorId);
  }
  
  /**
   * 👥 Obtiene el conteo de clientes asignados a un entrenador
   * @param entrenadorId - ID del entrenador
   * @returns Signal con el número de clientes asignados
   */
  getClientesCount(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      return entrenador?.entrenadosAsignadosIds?.length || 0;
    });
  }
  
  /**
   * 👤 Obtiene los entrenadores con información de usuario combinada
   * @returns Array de entrenadores con displayName, email, plan, etc.
   */
  getEntrenadoresWithUserInfo() {
    return computed(() => {
      return this._entrenadores().map(entrenador => {
        const usuario = this.userService.users().find(u => u.uid === entrenador.id);
        return {
          ...entrenador,
          displayName: usuario?.nombre || usuario?.email || `Usuario ${entrenador.id}`,
          email: usuario?.email || '',
          plan: usuario?.plan || 'free'
        };
      });
    });
  }
  
  /**
   * 🧹 Limpia los recursos del servicio
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isListenerInitialized = false;
    }
  }
}