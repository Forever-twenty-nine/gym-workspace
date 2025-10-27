import { Injectable, signal, computed, inject, InjectionToken, DestroyRef } from '@angular/core';
import { Entrenador } from '../models/entrenador.model';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';
import { NotificacionService } from './notificacion.service';
import { MensajeService } from './mensaje.service';
import { InvitacionService } from './invitacion.service';
import { Ejercicio } from '../models/ejercicio.model';

/**
 * Clase de error personalizada para límites de plan
 * Se lanza cuando se intenta exceder los límites del plan free
 * 
 * @class PlanLimitError
 * @extends Error
 */
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/**
 * Interfaz del adaptador de Firestore para Entrenadores
 * Define los métodos que debe implementar cualquier adaptador de persistencia
 * 
 * @interface IEntrenadorFirestoreAdapter
 */
export interface IEntrenadorFirestoreAdapter {
  /**
   * Obtiene todos los entrenadores y configura listeners en tiempo real
   * 
   * @param {Function} callback - Función que se ejecuta cuando los datos cambian
   * @returns {Function} Función de cleanup para detener el listener
   */
  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void;
  
  /**
   * Suscribe a cambios en un entrenador específico
   * 
   * @param {string} id - ID del entrenador
   * @param {Function} callback - Función que se ejecuta cuando el entrenador cambia
   * @returns {void}
   */
  subscribeToEntrenador(id: string, callback: (entrenador: Entrenador | null) => void): void;
  
  /**
   * Crea un nuevo entrenador
   * 
   * @param {Omit<Entrenador, 'id'>} entrenador - Datos del entrenador a crear
   * @returns {Promise<string>} Promise con el ID del entrenador creado
   */
  create(entrenador: Omit<Entrenador, 'id'>): Promise<string>;
  
  /**
   * Crea un nuevo entrenador con ID específico
   * 
   * @param {string} id - ID específico del entrenador
   * @param {Omit<Entrenador, 'id'>} entrenador - Datos del entrenador a crear
   * @returns {Promise<void>}
   */
  createWithId?(id: string, entrenador: Omit<Entrenador, 'id'>): Promise<void>;
  
  /**
   * Actualiza un entrenador existente
   * 
   * @param {string} id - ID del entrenador
   * @param {Partial<Entrenador>} entrenador - Datos actualizados del entrenador
   * @returns {Promise<void>}
   */
  update(id: string, entrenador: Partial<Entrenador>): Promise<void>;
  
  /**
   * Elimina un entrenador
   * 
   * @param {string} id - ID del entrenador a eliminar
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;
}

/**
 * Token de inyección para el adaptador de Entrenadores
 * Permite la inyección de dependencias del adaptador de Firestore
 * 
 * @constant
 * @type {InjectionToken<IEntrenadorFirestoreAdapter>}
 */
export const ENTRENADOR_FIRESTORE_ADAPTER = new InjectionToken<IEntrenadorFirestoreAdapter>('EntrenadorFirestoreAdapter');

/**
 * Servicio de gestión de Entrenadores (trainers)
 * Maneja la lógica de negocio y el estado reactivo de los entrenadores usando Angular Signals
 * Compatible con aplicaciones zoneless de Angular 16+
 * Incluye validación de límites de plan (free vs premium)
 * 
 * @example
 * ```typescript
 * constructor(private entrenadorService: EntrenadorService) {
 *   const entrenadores = this.entrenadorService.entrenadores();
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class EntrenadorService {
  private readonly destroyRef = inject(DestroyRef);
  private adapter = inject(ENTRENADOR_FIRESTORE_ADAPTER);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);
  private notificacionService = inject(NotificacionService);
  private mensajeService = inject(MensajeService);
  private invitacionService = inject(InvitacionService);
  
  private readonly _entrenadores = signal<Entrenador[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private unsubscribe: (() => void) | null = null;
  private isListenerInitialized = false;
  private limitsCache = new Map<string, { maxClients: number; maxRoutines: number; maxExercises: number }>();
  
  /**
   * Signal de solo lectura con la lista de entrenadores
   * @readonly
   * @type {Signal<Entrenador[]>}
   */
  readonly entrenadores = this._entrenadores.asReadonly();
  
  /**
   * Signal de solo lectura con el estado de carga
   * @readonly
   * @type {Signal<boolean>}
   */
  readonly loading = this._loading.asReadonly();
  
  /**
   * Signal de solo lectura con el mensaje de error
   * @readonly
   * @type {Signal<string | null>}
   */
  readonly error = this._error.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }
  
  /**
   * Obtiene los límites del plan para un entrenador específico
   * Cachea los resultados para optimizar performance
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Object} Objeto con maxClients, maxRoutines y maxExercises
   */
  getLimits(entrenadorId: string) {
    if (this.limitsCache.has(entrenadorId)) {
      return this.limitsCache.get(entrenadorId)!;
    }
    const user = this.userService.users().find(u => u.uid === entrenadorId);
    const isFree = user?.plan === 'free';
    const limits = {
      maxClients: isFree ? 3 : Infinity,
      maxRoutines: isFree ? 3 : Infinity,
      maxExercises: isFree ? 10 : Infinity,
    };
    this.limitsCache.set(entrenadorId, limits);
    return limits;
  }

  /**
   * Valida que no se exceda el límite permitido para un tipo de item
   * 
   * @private
   * @param {string} entrenadorId - ID del entrenador
   * @param {number} currentCount - Conteo actual de items
   * @param {number} max - Límite máximo permitido
   * @param {string} item - Nombre del tipo de item para el mensaje de error
   * @throws {PlanLimitError} Si se excede el límite
   * @returns {void}
   */
  private validateLimit(entrenadorId: string, currentCount: number, max: number, item: string): void {
    if (currentCount >= max) {
      throw new PlanLimitError(`Límite alcanzado: ${currentCount}/${max} ${item} en plan free.`);
    }
  }

  /**
   * Agrega un item a un array del entrenador validando límites del plan
   * Método genérico para agregar clientes, rutinas o ejercicios
   * 
   * @private
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} itemId - ID del item a agregar
   * @param {keyof Entrenador} arrayKey - Clave del array en el modelo Entrenador
   * @param {keyof ReturnType<typeof this.getLimits>} maxKey - Clave del límite máximo
   * @param {string} itemName - Nombre del item para mensajes de error
   * @returns {Promise<void>}
   */
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

  /**
   * Invalida el caché de límites para un entrenador específico
   * Útil cuando cambia el plan del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {void}
   */
  invalidateLimitsCache(entrenadorId: string): void {
    this.limitsCache.delete(entrenadorId);
  }
  
  /**
   * Inicializa el listener de entrenadores
   * Solo se ejecuta una vez, debe llamarse manualmente cuando sea necesario
   * 
   * @returns {void}
   */
  initializeListener(): void {
    if (!this.isListenerInitialized) {
      this.loadEntrenadores();
      this.isListenerInitialized = true;
    }
  }

  /**
   * Carga inicial de entrenadores con listener en tiempo real
   * Configura la suscripción a cambios en la colección de entrenadores
   * 
   * @private
   * @returns {void}
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
   * Crea un nuevo entrenador
   * 
   * @param {Omit<Entrenador, 'id'>} entrenadorData - Datos del entrenador a crear
   * @returns {Promise<string>} Promise con el ID del entrenador creado
   * @throws {Error} Si ocurre un error durante la creación
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
   * Crea un nuevo entrenador con ID específico (igual al uid del usuario)
   * 
   * @param {string} id - ID específico del entrenador
   * @param {Omit<Entrenador, 'id'>} entrenadorData - Datos del entrenador a crear
   * @returns {Promise<void>}
   * @throws {Error} Si el adaptador no soporta createWithId o si ocurre un error
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
   * Actualiza un entrenador existente
   * 
   * @param {string} id - ID del entrenador
   * @param {Partial<Entrenador>} entrenadorData - Datos actualizados del entrenador
   * @returns {Promise<void>}
   * @throws {Error} Si ocurre un error durante la actualización
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
   * Elimina un entrenador
   * 
   * @param {string} id - ID del entrenador a eliminar
   * @returns {Promise<void>}
   * @throws {Error} Si ocurre un error durante la eliminación
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
   * Busca un entrenador por ID usando computed signal
   * 
   * @param {string} id - ID del entrenador
   * @returns {Signal<Entrenador | undefined>} Signal computada con el entrenador encontrado o undefined
   */
  getEntrenadorById(id: string) {
    return computed(() => 
      this._entrenadores().find(entrenador => entrenador.id === id)
    );
  }
  
  /**
   * Obtiene las rutinas de un entrenador específico
   * Filtra las rutinas del RutinaService por los IDs del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<Rutina[]>} Signal computada con las rutinas del entrenador
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
   * Obtiene los ejercicios de un entrenador específico
   * Filtra los ejercicios del EjercicioService por los IDs del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<Ejercicio[]>} Signal computada con los ejercicios del entrenador
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
   * Obtiene las invitaciones de un entrenador específico
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<Invitacion[]>} Signal con las invitaciones del entrenador
   */
  getInvitacionesByEntrenador(entrenadorId: string) {
    return this.invitacionService.getInvitacionesPorEntrenador(entrenadorId);
  }
  
  /**
   * Obtiene los mensajes de un entrenador específico
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<Mensaje[]>} Signal con los mensajes del entrenador
   */
  getMensajesByEntrenador(entrenadorId: string) {
    return this.mensajeService.getMensajesByEntrenador(entrenadorId);
  }
  
  /**
   * Obtiene el conteo de entrenados asignados a un entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<number>} Signal computada con el número de entrenados asignados
   */
  getEntrenadosCount(entrenadorId: string) {
    return computed(() => {
      const entrenador = this.getEntrenadorById(entrenadorId)();
      return entrenador?.entrenadosAsignadosIds?.length || 0;
    });
  }

  /**
   * Desvincula un entrenado de un entrenador
   * Actualiza ambos documentos para remover la asociación
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} entrenadoId - ID del entrenado
   * @returns {Promise<void>}
   */
  async desvincularEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = (entrenado.entrenadoresId || []).filter((id: string) => id !== entrenadorId);
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }

    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const entrenadosAsignadosIds = (entrenador.entrenadosAsignadosIds || []).filter((id: string) => id !== entrenadoId);
      await this.update(entrenadorId, { entrenadosAsignadosIds });
    }
  }
  
  /**
   * Obtiene los entrenadores con información de usuario combinada
   * Combina datos de entrenador con datos de usuario (displayName, email, plan)
   * 
   * @returns {Signal<Array>} Signal computada con entrenadores enriquecidos con info de usuario
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
   * Agrega un ejercicio a la lista de ejercicios creados de un entrenador
   * Valida los límites del plan antes de agregar
   * En plan free no permite configurar tiempos de descanso o serie
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} ejercicioId - ID del ejercicio a agregar
   * @returns {Promise<void>}
   * @throws {PlanLimitError} Si se excede el límite o si se usan campos premium en plan free
   */
  async addEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    const limits = this.getLimits(entrenadorId);
    if (limits.maxExercises === 10) {
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
   * Quita un ejercicio de la lista de ejercicios creados de un entrenador
   * No elimina el ejercicio, solo lo desvincula del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} ejercicioId - ID del ejercicio a quitar
   * @returns {Promise<void>}
   */
  async removeEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const ejerciciosCreadasIds = (entrenador.ejerciciosCreadasIds || []).filter((id: string) => id !== ejercicioId);
      await this.update(entrenadorId, { ejerciciosCreadasIds });
    }
  }

  /**
   * Elimina un ejercicio creado por un entrenador y actualiza su lista
   * Elimina el ejercicio del EjercicioService y lo desvincula del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} ejercicioId - ID del ejercicio a eliminar
   * @returns {Promise<void>}
   */
  async deleteEjercicioCreado(entrenadorId: string, ejercicioId: string): Promise<void> {
    await this.ejercicioService.delete(ejercicioId);
    await this.removeEjercicioCreado(entrenadorId, ejercicioId);
  }

  /**
   * Agrega una rutina a la lista de rutinas creadas de un entrenador
   * Valida los límites del plan antes de agregar
   * En plan free no permite configurar duración
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} rutinaId - ID de la rutina a agregar
   * @returns {Promise<void>}
   * @throws {PlanLimitError} Si se excede el límite o si se usan campos premium en plan free
   */
  async addRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (!entrenador) return;

    const limits = this.getLimits(entrenadorId);
    if (limits.maxRoutines === 3) {
      const rutina = this.rutinaService.getRutina(rutinaId)();
      if (rutina && rutina.duracion !== undefined) {
        throw new PlanLimitError('En el plan free no se pueden configurar duración. Actualiza a premium.');
      }
    }

    await this.addItemWithLimit(entrenadorId, rutinaId, 'rutinasCreadasIds', 'maxRoutines', 'rutinas');
  }

  /**
   * Quita una rutina de la lista de rutinas creadas de un entrenador
   * No elimina la rutina, solo la desvincula del entrenador
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} rutinaId - ID de la rutina a quitar
   * @returns {Promise<void>}
   */
  async removeRutinaCreada(entrenadorId: string, rutinaId: string): Promise<void> {
    const entrenador = this.getEntrenadorById(entrenadorId)();
    if (entrenador) {
      const rutinasCreadasIds = (entrenador.rutinasCreadasIds || []).filter((id: string) => id !== rutinaId);
      await this.update(entrenadorId, { rutinasCreadasIds });
    }
  }

  /**
   * Asigna un entrenado a un entrenador con validación de límites
   * Actualiza ambos documentos para establecer la asociación
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @param {string} entrenadoId - ID del entrenado a asignar
   * @returns {Promise<void>}
   * @throws {PlanLimitError} Si se excede el límite de clientes en plan free
   */
  async asignarEntrenado(entrenadorId: string, entrenadoId: string): Promise<void> {
    await this.addItemWithLimit(entrenadorId, entrenadoId, 'entrenadosAsignadosIds', 'maxClients', 'clientes activos');

    const entrenado = this.entrenadoService.getEntrenadoById(entrenadoId)();
    if (entrenado) {
      const entrenadoresId = [...(entrenado.entrenadoresId || []), entrenadorId];
      await this.entrenadoService.save({ ...entrenado, entrenadoresId });
    }
  }

  /**
   * Limpia todos los recursos y listeners del servicio
   * Se ejecuta automáticamente cuando el servicio se destruye
   * 
   * @private
   * @returns {void}
   */
  private cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isListenerInitialized = false;
    this.limitsCache.clear();
  }
}