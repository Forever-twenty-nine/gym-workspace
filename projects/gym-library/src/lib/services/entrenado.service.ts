import { Injectable, signal, WritableSignal, Signal, computed, DestroyRef, inject } from '@angular/core';
import { Entrenado } from '../models/entrenado.model';

/**
 * Interfaz para el adaptador de Firestore que maneja la persistencia de entrenados
 * @interface IEntrenadoFirestoreAdapter
 */
export interface IEntrenadoFirestoreAdapter {
  /**
   * Inicializa un listener para cambios en la colección de entrenados
   * @param {Function} onUpdate - Callback que se ejecuta cuando hay cambios
   * @returns {Function} Función de cleanup para detener el listener
   */
  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): () => void;
  
  /**
   * Suscribe a cambios de un entrenado específico
   * @param {string} id - ID del entrenado
   * @param {Function} onUpdate - Callback que se ejecuta cuando hay cambios
   * @returns {Function} Función de cleanup para detener la suscripción
   */
  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): () => void;
  
  /**
   * Guarda o actualiza un entrenado en Firestore
   * @param {Entrenado} entrenado - Entrenado a guardar
   * @returns {Promise<void>}
   */
  save(entrenado: Entrenado): Promise<void>;
  
  /**
   * Elimina un entrenado de Firestore
   * @param {string} id - ID del entrenado a eliminar
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;
}

/**
 * Servicio para la gestión de entrenados (trainees)
 * Proporciona gestión de estado reactiva usando Angular Signals
 * Compatible con aplicaciones zoneless de Angular 16+
 * 
 * @example
 * ```typescript
 * constructor(private entrenadoService: EntrenadoService) {
 *   const entrenados = this.entrenadoService.entrenados();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EntrenadoService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly _entrenados = signal<Entrenado[]>([]);
  private readonly entrenadoSignals = new Map<string, {
    signal: WritableSignal<Entrenado | null>;
    cleanup: () => void;
  }>();
  private isListenerInitialized = false;
  private firestoreAdapter?: IEntrenadoFirestoreAdapter;
  private listenerCleanup?: () => void;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Signal computada que retorna el conteo total de entrenados
   * @readonly
   * @type {Signal<number>}
   */
  readonly entrenadoCount = computed(() => this._entrenados().length);

  /**
   * Signal computada que retorna el conteo de entrenados activos
   * @readonly
   * @type {Signal<number>}
   */
  readonly entrenadoActivoCount = computed(() => this._entrenados().length);

  /**
   * Configura el adaptador de Firestore para la persistencia de datos
   * Debe ser llamado antes de usar cualquier operación de datos
   * 
   * @param {IEntrenadoFirestoreAdapter} adapter - Adaptador de Firestore
   * @returns {void}
   */
  setFirestoreAdapter(adapter: IEntrenadoFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
  }

  /**
   * Inicializa el listener de Firestore de forma segura
   * Solo se ejecuta una vez y si el adaptador está configurado
   * 
   * @private
   * @returns {void}
   */
  private initializeListener(): void {
    if (this.isListenerInitialized || !this.firestoreAdapter) return;
    
    try {
      this.listenerCleanup = this.firestoreAdapter.initializeListener((entrenados: Entrenado[]) => {
        this._entrenados.set([...entrenados]);
      });
      this.isListenerInitialized = true;
    } catch (e) {
      console.warn('Error inicializando listener de entrenados:', e);
    }
  }

  /**
   * Retorna un signal de solo lectura con la lista de entrenados
   * Inicializa el listener automáticamente en el primer acceso
   * 
   * @returns {Signal<Entrenado[]>} Signal de solo lectura con los entrenados
   */
  get entrenados(): Signal<Entrenado[]> {
    if (!this.isListenerInitialized && this.firestoreAdapter) {
      this.initializeListener();
    }
    return this._entrenados.asReadonly();
  }

  /**
   * Crea y retorna un signal para un entrenado específico
   * Reutiliza signals existentes para evitar suscripciones duplicadas
   * 
   * @param {string} id - ID del entrenado
   * @returns {Signal<Entrenado | null>} Signal de solo lectura con el entrenado
   */
  getEntrenado(id: string): Signal<Entrenado | null> {
    if (!this.entrenadoSignals.has(id)) {
      const entrenadoSignal = signal<Entrenado | null>(null);
      let cleanup: () => void = () => {};
      
      if (this.firestoreAdapter) {
        cleanup = this.firestoreAdapter.subscribeToEntrenado(id, (entrenado) => {
          entrenadoSignal.set(entrenado);
        });
      }
      
      this.entrenadoSignals.set(id, { signal: entrenadoSignal, cleanup });
    }
    
    return this.entrenadoSignals.get(id)!.signal.asReadonly();
  }

  /**
   * Guarda o actualiza un entrenado con actualización optimista
   * Actualiza el estado inmediatamente y revierte en caso de error
   * 
   * @param {Entrenado} entrenado - Entrenado a guardar
   * @returns {Promise<void>}
   * @throws {Error} Si el adaptador de Firestore no está configurado
   */
  async save(entrenado: Entrenado): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    const previousState = this._entrenados();
    
    try {
      const index = previousState.findIndex(e => e.id === entrenado.id);
      const newState = index >= 0
        ? previousState.map((e, i) => i === index ? { ...entrenado } : e)
        : [...previousState, entrenado];
      
      this._entrenados.set(newState);
      await this.firestoreAdapter.save(entrenado);
    } catch (error) {
      this._entrenados.set(previousState);
      console.error('Error al guardar entrenado:', error);
      throw error;
    }
  }

  /**
   * Elimina un entrenado por ID con actualización optimista
   * Actualiza el estado inmediatamente y revierte en caso de error
   * 
   * @param {string} id - ID del entrenado a eliminar
   * @returns {Promise<void>}
   * @throws {Error} Si el adaptador de Firestore no está configurado
   */
  async delete(id: string): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    const previousState = this._entrenados();
    
    try {
      this._entrenados.set(previousState.filter(e => e.id !== id));
      await this.firestoreAdapter.delete(id);
    } catch (error) {
      this._entrenados.set(previousState);
      console.error('Error al eliminar entrenado:', error);
      throw error;
    }
  }

  /**
   * Busca un entrenado por ID usando computed signal para optimizar performance
   * El signal se recalcula automáticamente cuando cambia la lista de entrenados
   * 
   * @param {string} id - ID del entrenado a buscar
   * @returns {Signal<Entrenado | null>} Signal computada con el entrenado o null
   */
  getEntrenadoById(id: string): Signal<Entrenado | null> {
    return computed(() => 
      this._entrenados().find(e => e.id === id) ?? null
    );
  }

  /**
   * Filtra entrenados por objetivo usando computed signal
   * 
   * @param {string} objetivo - Objetivo a filtrar
   * @returns {Signal<Entrenado[]>} Signal computada con los entrenados filtrados
   */
  getEntrenadosByObjetivo(objetivo: string): Signal<Entrenado[]> {
    return computed(() => 
      this._entrenados().filter(e => e.objetivo === objetivo)
    );
  }

  /**
   * Filtra entrenados por entrenador usando computed signal
   * 
   * @param {string} entrenadorId - ID del entrenador
   * @returns {Signal<Entrenado[]>} Signal computada con los entrenados del entrenador
   */
  getEntrenadosByEntrenador(entrenadorId: string): Signal<Entrenado[]> {
    return computed(() => 
      this._entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId))
    );
  }

  /**
   * Filtra entrenados que tienen una rutina creada específica
   * 
   * @param {string} rutinaId - ID de la rutina creada
   * @returns {Signal<Entrenado[]>} Signal computada con los entrenados filtrados
   */
  getEntrenadosByRutinaCreada(rutinaId: string): Signal<Entrenado[]> {
    return computed(() => 
      this._entrenados().filter(e => e.rutinasCreadas?.includes(rutinaId))
    );
  }

  /**
   * Filtra entrenados que tienen una rutina asignada específica
   * 
   * @param {string} rutinaId - ID de la rutina asignada
   * @returns {Signal<Entrenado[]>} Signal computada con los entrenados filtrados
   * @todo Implementar lógica de filtrado por rutina asignada
   */
  getEntrenadosByRutinaAsignada(rutinaId: string): Signal<Entrenado[]> {
    return computed(() => []);
  }

  /**
   * Retorna todos los entrenados activos
   * 
   * @returns {Signal<Entrenado[]>} Signal de solo lectura con los entrenados activos
   */
  getEntrenadosActivos(): Signal<Entrenado[]> {
    return this._entrenados.asReadonly();
  }
  /**
   * Limpia todos los recursos y listeners del servicio
   * Se ejecuta automáticamente cuando el servicio se destruye
   * 
   * @private
   * @returns {void}
   */
  private cleanup(): void {
    if (this.listenerCleanup) {
      this.listenerCleanup();
      this.listenerCleanup = undefined;
    }

    this.entrenadoSignals.forEach(({ cleanup }) => cleanup());
    this.entrenadoSignals.clear();
    this.isListenerInitialized = false;
  }

  /**
   * Reinicia el servicio a su estado inicial
   * Útil para testing o cuando cambia el usuario autenticado
   * 
   * @returns {void}
   */
  reset(): void {
    this.cleanup();
    this._entrenados.set([]);
  }
}