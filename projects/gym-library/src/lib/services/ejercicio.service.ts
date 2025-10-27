import { Injectable, signal, WritableSignal, Signal, computed, DestroyRef, inject } from '@angular/core';
import { Ejercicio } from '../models/ejercicio.model';
import { Rol } from '../enums/rol.enum';

export interface IEjercicioFirestoreAdapter {
  initializeListener(
    onUpdate: (ejercicios: Ejercicio[]) => void,
    onError?: (error: string) => void
  ): void;
  subscribeToEjercicio(
    id: string,
    onUpdate: (ejercicio: Ejercicio | null) => void
  ): (() => void) | void;
  save(ejercicio: Ejercicio): Promise<void>;
  delete(id: string): Promise<void>;
  unsubscribe?(): void;
}

/**
 * Tipo de error específico para el servicio de ejercicios
 */
export type EjercicioServiceError =
  | 'ADAPTER_NOT_CONFIGURED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';


@Injectable({ providedIn: 'root' })
export class EjercicioService {
  private readonly destroyRef = inject(DestroyRef);
  
  // Signals privados
  private readonly _ejercicios = signal<Ejercicio[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<EjercicioServiceError | null>(null);
  private readonly _isListenerInitialized = signal<boolean>(false);
  
  private ejercicioSignals = new Map<string, WritableSignal<Ejercicio | null>>();
  private ejercicioUnsubscribers = new Map<string, () => void>();
  private computedFilters = new Map<string, Signal<any>>();
  private firestoreAdapter: IEjercicioFirestoreAdapter | null = null;

  constructor() {
    // ✅ Cleanup automático cuando el servicio se destruye (Angular 16+)
    this.destroyRef.onDestroy(() => {
      this.destroy();
    });
  }
  
  // Signals computadas públicas (creadas una vez)
  readonly ejercicioCount = computed(() => this._ejercicios().length);
  readonly isEjerciciosLoaded = computed(() =>
    this._ejercicios().length > 0 || this._isListenerInitialized()
  );
  
  /**
   * Obtiene un signal con los ejercicios que tienen peso asignado
   * @returns Signal que emite el array de ejercicios con peso
   */
  getEjerciciosConPeso(): Signal<Ejercicio[]> {
    return computed(() => this._ejercicios().filter(e => e.peso && e.peso > 0));
  }

  /**
   * Obtiene un signal con los ejercicios que no tienen peso asignado
   * @returns Signal que emite el array de ejercicios sin peso
   */
  getEjerciciosSinPeso(): Signal<Ejercicio[]> {
    return computed(() => this._ejercicios().filter(e => !e.peso || e.peso === 0));
  }
  
  /**
   * Signal de solo lectura con la lista de ejercicios
   */
  get ejercicios(): Signal<Ejercicio[]> {
    return this._ejercicios.asReadonly();
  }

  /**
   * Signal de solo lectura con el estado de carga
   */
  get isLoading(): Signal<boolean> {
    return this._isLoading.asReadonly();
  }

  /**
   * Signal de solo lectura con el error actual
   */
  get error(): Signal<EjercicioServiceError | null> {
    return this._error.asReadonly();
  }

  /**
   * Indica si el adaptador de Firestore está configurado
   */
  get isAdapterConfigured(): boolean {
    return !!this.firestoreAdapter;
  }
  
  /**
   * Valida los datos de un ejercicio
   * @param ejercicio - El ejercicio a validar
   * @returns Objeto con el error y mensaje si existe validación fallida
   */
  private validateEjercicio(ejercicio: Ejercicio): {
    error: EjercicioServiceError | null;
    message?: string
  } {
    if (!ejercicio.nombre || ejercicio.nombre.trim() === '') {
      return { error: 'VALIDATION_ERROR', message: 'El nombre del ejercicio es obligatorio' };
    }
    if (ejercicio.series < 0) {
      return { error: 'VALIDATION_ERROR', message: 'Las series deben ser un valor positivo' };
    }
    if (ejercicio.repeticiones < 0) {
      return { error: 'VALIDATION_ERROR', message: 'Las repeticiones deben ser un valor positivo' };
    }
    if (ejercicio.peso !== undefined && ejercicio.peso < 0) {
      return { error: 'VALIDATION_ERROR', message: 'El peso debe ser un valor positivo' };
    }
    return { error: null };
  }
  
  /**
   * Filtra elementos por rango numérico
   * @param items - Array de elementos a filtrar
   * @param getValue - Función para obtener el valor numérico de cada elemento
   * @param min - Valor mínimo del rango
   * @param max - Valor máximo del rango (opcional)
   * @returns Array filtrado por el rango especificado
   */
  private filterByRange<T>(
    items: T[],
    getValue: (item: T) => number,
    min: number,
    max?: number
  ): T[] {
    return items.filter(item => {
      const value = getValue(item);
      return max !== undefined ? value >= min && value <= max : value >= min;
    });
  }
  
  /**
   * Configura el adaptador de Firestore para el servicio
   * @param adapter - Instancia del adaptador de Firestore
   */
  setFirestoreAdapter(adapter: IEjercicioFirestoreAdapter): void {
    if (this.firestoreAdapter && this._isListenerInitialized()) {
      this.firestoreAdapter.unsubscribe?.();
      this._isListenerInitialized.set(false);
    }
    this.firestoreAdapter = adapter;
  }
  
  /**
   * Inicializa el listener de Firestore para ejercicios
   */
  private initializeListener(): void {
    if (this._isListenerInitialized() || !this.firestoreAdapter) return;

    try {
      this.firestoreAdapter.initializeListener(
        (ejercicios: Ejercicio[]) => {
          this._ejercicios.set(ejercicios);
        },
        (error: string) => {
          console.error('Error en listener:', error);
          this._error.set('NETWORK_ERROR');
        }
      );
      this._isListenerInitialized.set(true);
    } catch (e) {
      console.error('Error inicializando listener de ejercicios:', e);
      this._error.set('NETWORK_ERROR');
    }
  }
  
  /**
   * Inicializa el listener de ejercicios si no está ya inicializado
   */
  initializeEjerciciosListener(): void {
    if (!this._isListenerInitialized() && this.firestoreAdapter) {
      this.initializeListener();
    }
  }
  
  /**
   * Busca un ejercicio por su ID en la lista cargada
   * @param id - Identificador único del ejercicio
   * @returns El ejercicio encontrado o null si no existe
   */
  findEjercicioById(id: string): Ejercicio | null {
    return this._ejercicios().find(e => e.id === id) || null;
  }
  
  /**
   * Obtiene un ejercicio específico por ID con suscripción individual
   * @param id - Identificador único del ejercicio
   * @returns Signal que emite el ejercicio o null si no existe
   */
  getEjercicio(id: string): Signal<Ejercicio | null> {
    const existsInList = this._ejercicios().some(e => e.id === id);

    if (existsInList) {
      const key = `list-ejercicio-${id}`;
      if (!this.computedFilters.has(key)) {
        this.computedFilters.set(key, computed(() =>
          this._ejercicios().find(e => e.id === id) || null
        ));
      }
      return this.computedFilters.get(key)!;
    }

    if (!this.ejercicioSignals.has(id)) {
      const ejercicioSignal = signal<Ejercicio | null>(null);
      this.ejercicioSignals.set(id, ejercicioSignal);

      if (this.firestoreAdapter) {
        const unsubscribe = this.firestoreAdapter.subscribeToEjercicio(
          id,
          (ejercicio) => ejercicioSignal.set(ejercicio)
        );

        if (typeof unsubscribe === 'function') {
          this.ejercicioUnsubscribers.set(id, unsubscribe);
        }
      }
    }

    return this.ejercicioSignals.get(id)!.asReadonly();
  }
  
  /**
   * Guarda un ejercicio en la base de datos
   * @param ejercicio - El ejercicio a guardar
   * @throws Error si el adaptador no está configurado o si hay errores de validación
   */
  async save(ejercicio: Ejercicio): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }

    const validation = this.validateEjercicio(ejercicio);
    if (validation.error) {
      throw new Error(validation.message || 'Error de validación');
    }

    const normalizedEjercicio = this.normalizeEjercicio(ejercicio);

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.firestoreAdapter.save(normalizedEjercicio);
    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error);
      this._error.set('NETWORK_ERROR');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Elimina un ejercicio de la base de datos con eliminación optimista
   * @param id - Identificador único del ejercicio a eliminar
   * @throws Error si el adaptador no está configurado o si el ejercicio no existe
   */
  async delete(id: string): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }

    if (!id || id.trim() === '') {
      this._error.set('VALIDATION_ERROR');
      throw new Error('ID de ejercicio inválido');
    }

    this._isLoading.set(true);
    this._error.set(null);

    const currentEjercicios = this._ejercicios();
    const ejercicioToDelete = currentEjercicios.find(e => e.id === id);

    if (!ejercicioToDelete) {
      this._error.set('VALIDATION_ERROR');
      throw new Error('Ejercicio no encontrado');
    }

    this._ejercicios.update(ejercicios => ejercicios.filter(e => e.id !== id));

    try {
      await this.firestoreAdapter.delete(id);
    } catch (error: any) {
      this._ejercicios.update(ejercicios => [...ejercicios, ejercicioToDelete]);
      console.error('Error al eliminar ejercicio:', error);
      this._error.set('NETWORK_ERROR');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Normaliza los datos de un ejercicio antes de guardarlo
   * @param ejercicio - El ejercicio a normalizar
   * @returns El ejercicio normalizado
   */
  private normalizeEjercicio(ejercicio: Ejercicio): Ejercicio {
    const normalized: any = { ...ejercicio };

    normalized.nombre = normalized.nombre.trim();

    if (normalized.descripcion) {
      normalized.descripcion = normalized.descripcion.trim();
      if (normalized.descripcion === '') {
        delete normalized.descripcion;
      }
    }

    Object.keys(normalized).forEach(key => {
      if (normalized[key] === undefined) {
        delete normalized[key];
      }
    });

    const now = new Date();
    if (!normalized.id || normalized.id === '') {
      normalized.fechaCreacion = now;
    }
    normalized.fechaModificacion = now;

    return normalized;
  }
  
  /**
   * Filtra ejercicios por nombre (búsqueda insensible a mayúsculas)
   * @param nombre - Texto a buscar en el nombre del ejercicio
   * @returns Signal que emite el array de ejercicios filtrados
   */
  getEjerciciosByNombre(nombre: string): Signal<Ejercicio[]> {
    return computed(() =>
      this._ejercicios().filter(ejercicio =>
        ejercicio.nombre.toLowerCase().includes(nombre.toLowerCase())
      )
    );
  }
  
  /**
   * Filtra ejercicios por descripción (búsqueda insensible a mayúsculas)
   * @param descripcion - Texto a buscar en la descripción del ejercicio
   * @returns Signal que emite el array de ejercicios filtrados
   */
  getEjerciciosByDescripcion(descripcion: string): Signal<Ejercicio[]> {
    return computed(() =>
      this._ejercicios().filter(ejercicio =>
        ejercicio.descripcion?.toLowerCase().includes(descripcion.toLowerCase())
      )
    );
  }
  
  /**
   * Filtra ejercicios por rango de series
   * @param minSeries - Número mínimo de series
   * @param maxSeries - Número máximo de series (opcional)
   * @returns Signal que emite el array de ejercicios filtrados
   */
  getEjerciciosBySeries(minSeries: number, maxSeries?: number): Signal<Ejercicio[]> {
    return computed(() =>
      this.filterByRange(this._ejercicios(), e => e.series, minSeries, maxSeries)
    );
  }
  
  /**
   * Filtra ejercicios por rango de repeticiones
   * @param minReps - Número mínimo de repeticiones
   * @param maxReps - Número máximo de repeticiones (opcional)
   * @returns Signal que emite el array de ejercicios filtrados
   */
  getEjerciciosByRepeticiones(minReps: number, maxReps?: number): Signal<Ejercicio[]> {
    return computed(() =>
      this.filterByRange(this._ejercicios(), e => e.repeticiones, minReps, maxReps)
    );
  }
  
  /**
   * Verifica si un rol puede crear ejercicios
   * @param rol - Rol del usuario a verificar
   * @returns true si el rol puede crear ejercicios, false en caso contrario
   */
  static canCreateEjercicio(rol: Rol): boolean {
    return rol === Rol.ENTRENADO || rol === Rol.ENTRENADOR;
  }

  /**
   * Obtiene la lista de roles que pueden crear ejercicios
   * @returns Array de roles autorizados para crear ejercicios
   */
  static getRolesCreadores(): Rol[] {
    return [Rol.ENTRENADO, Rol.ENTRENADOR];
  }
  
  /**
   * Limpia el estado de error actual
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Libera todos los recursos y limpia el estado del servicio
   */
  destroy(): void {
    if (this.firestoreAdapter && this._isListenerInitialized()) {
      this.firestoreAdapter.unsubscribe?.();
    }

    this.ejercicioUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.ejercicioUnsubscribers.clear();

    this._isListenerInitialized.set(false);
    this.ejercicioSignals.clear();
    this.computedFilters.clear();
    this._ejercicios.set([]);
    this._isLoading.set(false);
    this._error.set(null);
  }
}