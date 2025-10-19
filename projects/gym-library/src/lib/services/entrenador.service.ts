import { Injectable, signal, computed, inject, InjectionToken } from '@angular/core';
import { Entrenador } from '../models/entrenador.model';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';
import { NotificacionService } from './notificacion.service';
import { MensajeService } from './mensaje.service';
import { InvitacionService } from './invitacion.service';
import { Ejercicio } from '../models/ejercicio.model';

// Clase de error personalizada para límites
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

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
  private invitacionService = inject(InvitacionService);
  
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
  
  // Cache para límites por entrenador (evita búsquedas repetidas)
  private limitsCache = new Map<string, { maxClients: number; maxRoutines: number; maxExercises: number }>();
  
  // Métodos privados para límites de plan
  getLimits(entrenadorId: string) {
    if (this.limitsCache.has(entrenadorId)) {
      return this.limitsCache.get(entrenadorId)!;
    }
    const user = this.userService.users().find(u => u.uid === entrenadorId);
    const isFree = user?.plan === 'free';
    const limits = {
      maxClients: isFree ? 3 : Infinity,
      maxRoutines: isFree ? 5 : Infinity,
      maxExercises: isFree ? 10 : Infinity,
    };
    this.limitsCache.set(entrenadorId, limits);
    return limits;
  }

  private validateLimit(entrenadorId: string, currentCount: number, max: number, item: string): void {
    if (currentCount >= max) {
      throw new PlanLimitError(`Límite alcanzado: ${currentCount}/${max} ${item} en plan free.`);
    }
  }

  // Método genérico para agregar items con validación
  private async addItemWithLimit(
    entrenadorId: string,
    itemId: string,
    arrayKey: keyof Entrenador,
    maxKey: keyof ReturnType<typeof this.getLimits>,
    itemName: string
  ): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    const limits = this.getLimits(entrenadorId);
    const currentArray = (entrenador[arrayKey] as string[]) || [];
    this.validateLimit(entrenadorId, currentArray.length, limits[maxKey], itemName);

    if (!currentArray.includes(itemId)) {
      const updatedArray = [...currentArray, itemId];
      await this.update(entrenadorId, { [arrayKey]: updatedArray });
    }
  }

  // Método para invalidar cache de límites (llamar cuando cambie el plan)
  invalidateLimitsCache(entrenadorId: string): void {
    this.limitsCache.delete(entrenadorId);
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
      const entrenador = this._entrenadores().find(e => e.id === entrenadorId);
      if (!entrenador || !entrenador.rutinasCreadasIds) {
        return [];
      }
      return this.rutinaService.rutinas().filter(rutina => 
        entrenador.rutinasCreadasIds.includes(rutina.id)
      );
    });
  }
  
  /**
   * 📋 Obtiene los ejercicios de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de ejercicios del entrenador
   */
  getEjerciciosByEntrenador(entrenadorId: string) {
    return computed(() => {
      const entrenador = this._entrenadores().find(e => e.id === entrenadorId);
      if (!entrenador || !entrenador.ejerciciosCreadasIds) {
        return [];
      }
      return this.ejercicioService.ejercicios().filter(ejercicio => 
        entrenador.ejerciciosCreadasIds.includes(ejercicio.id)
      );
    });
  }
  
  /**
   * 📨 Obtiene las invitaciones de un entrenador específico
   * @param entrenadorId - ID del entrenador
   * @returns Array de invitaciones del entrenador
   */
  getInvitacionesByEntrenador(entrenadorId: string) {
    return this.invitacionService.getInvitacionesPorEntrenador(entrenadorId);
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
   * 👥 Obtiene el conteo de entrenados asignados a un entrenador
   * @param entrenadorId - ID del entrenador
   * @returns Signal con el número de entrenados asignados
   */
  getEntrenadosCount(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      return entrenador?.entrenadosAsignadosIds?.length || 0;
    });
  }

  /**
   * 🔗 Desvincula un entrenado de un entrenador
   * @param entrenadorId - ID del entrenador
   * @param entrenadoId - ID del entrenado
   */
  async desvincularEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    // 1. Quitar entrenadorId del array entrenadoresId del entrenado
    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = (entrenado.entrenadoresId || []).filter((id: string) => id !== entrenadorId);
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }

    // 2. Quitar entrenadoId del array entrenadosAsignadosIds del entrenador
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const entrenadosAsignadosIds = (entrenador.entrenadosAsignadosIds || []).filter((id: string) => id !== entrenadoId);
      await this.update(entrenadorId, { entrenadosAsignadosIds });
    }
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
   * ➕ Agrega un ejercicio a la lista de ejercicios creados de un entrenador
   * @param entrenadorId - ID del entrenador
   * @param ejercicioId - ID del ejercicio a agregar
   */
  async addEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    // Validación de plan: free no puede crear ejercicios con campos premium
    const limits = this.getLimits(entrenadorId);
    if (limits.maxExercises === 3) { // Plan free
      const ejercicio = this.ejercicioService.getEjercicio(ejercicioId)();
      if (ejercicio && (ejercicio.descansoSegundos !== undefined || ejercicio.serieSegundos !== undefined)) {
        throw new PlanLimitError('En el plan free no se pueden configurar tiempos de descanso o serie. Actualiza a premium.');
      }
    }

    const limitsGeneral = this.getLimits(entrenadorId);
    const currentCount = entrenador.ejerciciosCreadasIds?.length || 0;
    this.validateLimit(entrenadorId, currentCount, limitsGeneral.maxExercises, 'ejercicios');

    const ejerciciosCreadasIds = [...(entrenador.ejerciciosCreadasIds || [])];
    if (!ejerciciosCreadasIds.includes(ejercicioId)) {
      ejerciciosCreadasIds.push(ejercicioId);
      await this.update(entrenadorId, { ejerciciosCreadasIds });
    }
  }

  /**
   * ➖ Quita un ejercicio de la lista de ejercicios creados de un entrenador
   * @param entrenadorId - ID del entrenador
   * @param ejercicioId - ID del ejercicio a quitar
   */
  async removeEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const ejerciciosCreadasIds = (entrenador.ejerciciosCreadasIds || []).filter((id: string) => id !== ejercicioId);
      await this.update(entrenadorId, { ejerciciosCreadasIds });
    }
  }

  /**
   * ➕ Agrega una rutina a la lista de rutinas creadas de un entrenador
   * @param entrenadorId - ID del entrenador
   * @param rutinaId - ID de la rutina a agregar
   */
  async addRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    // Validación de plan: free no puede crear rutinas con campos premium
    const limits = this.getLimits(entrenadorId);
    if (limits.maxRoutines === 5) { // Plan free
      const rutina = this.rutinaService.getRutina(rutinaId)();
      if (rutina && (rutina.DiasSemana !== undefined || rutina.duracion !== undefined)) {
        throw new PlanLimitError('En el plan free no se pueden configurar días de la semana o duración. Actualiza a premium.');
      }
    }

    await this.addItemWithLimit(entrenadorId, rutinaId, 'rutinasCreadasIds', 'maxRoutines', 'rutinas');
  }

  /**
   * ➖ Quita una rutina de la lista de rutinas creadas de un entrenador
   * @param entrenadorId - ID del entrenador
   * @param rutinaId - ID de la rutina a quitar
   */
  async removeRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const rutinasCreadasIds = (entrenador.rutinasCreadasIds || []).filter((id: string) => id !== rutinaId);
      await this.update(entrenadorId, { rutinasCreadasIds });
    }
  }

  /**
   * ➕ Asigna un entrenado a un entrenador con validación de límites
   * @param entrenadorId - ID del entrenador
   * @param entrenadoId - ID del entrenado a asignar
   */
  async asignarEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    await this.addItemWithLimit(entrenadorId, entrenadoId, 'entrenadosAsignadosIds', 'maxClients', 'clientes activos');

    // Actualizar entrenado (solo después de validar límite)
    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = [...(entrenado.entrenadoresId || []), entrenadorId];
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }
  }
}