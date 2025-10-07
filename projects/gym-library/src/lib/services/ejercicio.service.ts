import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Ejercicio } from '../models/ejercicio.model';
import { Rol } from '../enums/rol.enum';

export interface IEjercicioFirestoreAdapter {
  initializeListener(onUpdate: (ejercicios: Ejercicio[]) => void): void;
  subscribeToEjercicio(id: string, onUpdate: (ejercicio: Ejercicio | null) => void): void;
  save(ejercicio: Ejercicio): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * ❌ Errores de validación personalizados
 */
export class EjercicioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EjercicioValidationError';
  }
}

@Injectable({ providedIn: 'root' })
export class EjercicioService {
	private readonly _ejercicios: WritableSignal<Ejercicio[]> = signal<Ejercicio[]>([]);
	private readonly ejercicioSignals = new Map<string, WritableSignal<Ejercicio | null>>();
	private isListenerInitialized = false;
	private firestoreAdapter?: IEjercicioFirestoreAdapter;

	constructor() {
		// La inicialización se hará cuando se configure el adaptador
	}

	/**
	 * Configura el adaptador de Firestore
	 */
	setFirestoreAdapter(adapter: IEjercicioFirestoreAdapter): void {
		this.firestoreAdapter = adapter;
		this.initializeListener();
	}

	/**
	 * 🔄 Inicializa el listener de Firestore de forma segura
	 */
	private initializeListener(): void {
		if (this.isListenerInitialized || !this.firestoreAdapter) return;
		
		try {
			this.firestoreAdapter.initializeListener((ejercicios: Ejercicio[]) => {
				this._ejercicios.set(ejercicios);
			});
			this.isListenerInitialized = true;
		} catch (e) {
			console.warn('Error inicializando listener de ejercicios:', e);
		}
	}

	/**
	 * 📊 Signal readonly con todos los ejercicios
	 */
	get ejercicios(): Signal<Ejercicio[]> {
		if (!this.isListenerInitialized && this.firestoreAdapter) {
			this.initializeListener();
		}
		return this._ejercicios.asReadonly();
	}

	/**
	 * 📊 Obtiene un ejercicio específico por ID
	 */
	getEjercicio(id: string): Signal<Ejercicio | null> {
		if (!this.ejercicioSignals.has(id)) {
			const ejercicioSignal = signal<Ejercicio | null>(null);
			this.ejercicioSignals.set(id, ejercicioSignal);
			
			if (this.firestoreAdapter) {
				this.firestoreAdapter.subscribeToEjercicio(id, (ejercicio) => {
					ejercicioSignal.set(ejercicio);
				});
			}
		}
		return this.ejercicioSignals.get(id)!.asReadonly();
	}

	/**
	 * ✅ Valida las reglas de negocio del ejercicio
	 * @throws {EjercicioValidationError} Si la validación falla
	 */
	validateEjercicio(ejercicio: Ejercicio): void {
		// Validación 1: Solo ENTRENADO o ENTRENADOR pueden ser creadores
		if (ejercicio.creadorTipo) {
			if (ejercicio.creadorTipo !== Rol.ENTRENADO && ejercicio.creadorTipo !== Rol.ENTRENADOR) {
				throw new EjercicioValidationError(
					`Solo entrenados y entrenadores pueden crear ejercicios. Tipo recibido: ${ejercicio.creadorTipo}`
				);
			}
		}

		// Validación 2: Solo ENTRENADO puede ser asignado
		if (ejercicio.asignadoATipo) {
			if (ejercicio.asignadoATipo !== Rol.ENTRENADO) {
				throw new EjercicioValidationError(
					`Los ejercicios solo pueden ser asignados a entrenados. Tipo recibido: ${ejercicio.asignadoATipo}`
				);
			}
		}

		// Validación 3: Si hay asignadoAId, debe haber asignadoATipo
		if (ejercicio.asignadoAId && !ejercicio.asignadoATipo) {
			throw new EjercicioValidationError(
				'Si se especifica un usuario asignado, debe especificarse el tipo de asignado'
			);
		}

		// Validación 4: Si hay creadorId, debe haber creadorTipo
		if (ejercicio.creadorId && !ejercicio.creadorTipo) {
			throw new EjercicioValidationError(
				'Si se especifica un creador, debe especificarse el tipo de creador'
			);
		}

		// Validación 5: Valores numéricos positivos
		if (ejercicio.series < 0) {
			throw new EjercicioValidationError('Las series deben ser un valor positivo');
		}

		if (ejercicio.repeticiones < 0) {
			throw new EjercicioValidationError('Las repeticiones deben ser un valor positivo');
		}

		if (ejercicio.peso !== undefined && ejercicio.peso < 0) {
			throw new EjercicioValidationError('El peso debe ser un valor positivo');
		}
	}

	/**
	 * � Normaliza y limpia el ejercicio antes de guardar
	 */
	private normalizeEjercicio(ejercicio: Ejercicio): Ejercicio {
		const normalized = { ...ejercicio };

		// Limpiar campos vacíos de creador
		if (!normalized.creadorId || normalized.creadorId === '') {
			delete normalized.creadorId;
			delete normalized.creadorTipo;
		}

		// Limpiar campos vacíos de asignado
		if (!normalized.asignadoAId || normalized.asignadoAId === '') {
			delete normalized.asignadoAId;
			delete normalized.asignadoATipo;
		}

		// Si hay asignadoAId, asegurarse que asignadoATipo sea ENTRENADO
		if (normalized.asignadoAId) {
			normalized.asignadoATipo = Rol.ENTRENADO;
		}

		// Agregar o actualizar metadatos de fecha
		const now = new Date();
		if (!normalized.id || normalized.id === '') {
			// Es una creación
			normalized.fechaCreacion = now;
		}
		normalized.fechaModificacion = now;

		return normalized;
	}

	/**
	 * �💾 Guarda o actualiza un ejercicio (upsert si tiene id).
	 * Aplica validaciones y normalización automáticamente.
	 * @throws {EjercicioValidationError} Si la validación falla
	 */
	async save(ejercicio: Ejercicio): Promise<void> {
		if (!this.firestoreAdapter) {
			throw new Error('Firestore adapter no configurado');
		}

		// Normalizar el ejercicio
		const normalizedEjercicio = this.normalizeEjercicio(ejercicio);

		// Validar las reglas de negocio
		this.validateEjercicio(normalizedEjercicio);
		
		try {
			await this.firestoreAdapter.save(normalizedEjercicio);
		} catch (error) {
			console.error('Error al guardar ejercicio:', error);
			throw error;
		}
	}

	/**
	 * 🗑️ Elimina un ejercicio por ID
	 */
	async delete(id: string): Promise<void> {
		if (!this.firestoreAdapter) {
			throw new Error('Firestore adapter no configurado');
		}
		
		try {
			await this.firestoreAdapter.delete(id);
		} catch (error) {
			console.error('Error al eliminar ejercicio:', error);
			throw error;
		}
	}

	/**
	 * 🔍 Busca ejercicios por nombre
	 */
	getEjerciciosByNombre(nombre: string): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => 
				ejercicio.nombre.toLowerCase().includes(nombre.toLowerCase())
			)
		);
	}

	/**
	 * 🔍 Busca ejercicios por descripción
	 */
	getEjerciciosByDescripcion(descripcion: string): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => 
				ejercicio.descripcion?.toLowerCase().includes(descripcion.toLowerCase())
			)
		);
	}

	/**
	 * 🔍 Busca ejercicios por rango de series
	 */
	getEjerciciosBySeries(minSeries: number, maxSeries?: number): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => {
				if (maxSeries) {
					return ejercicio.series >= minSeries && ejercicio.series <= maxSeries;
				}
				return ejercicio.series >= minSeries;
			})
		);
	}

	/**
	 * 📊 Obtiene el conteo total de ejercicios
	 */
	get ejercicioCount(): Signal<number> {
		return computed(() => this._ejercicios().length);
	}

	/**
	 * 🔍 Busca ejercicios por rango de repeticiones
	 */
	getEjerciciosByRepeticiones(minReps: number, maxReps?: number): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => {
				if (maxReps) {
					return ejercicio.repeticiones >= minReps && ejercicio.repeticiones <= maxReps;
				}
				return ejercicio.repeticiones >= minReps;
			})
		);
	}

	/**
	 * 🔍 Obtiene ejercicios con peso específico
	 */
	getEjerciciosConPeso(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.peso && ejercicio.peso > 0)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios sin peso (peso corporal)
	 */
	getEjerciciosSinPeso(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => !ejercicio.peso || ejercicio.peso === 0)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios creados por un usuario específico
	 */
	getEjerciciosByCreador(creadorId: string): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.creadorId === creadorId)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios creados por un tipo de rol específico
	 */
	getEjerciciosByCreadorTipo(creadorTipo: Rol): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.creadorTipo === creadorTipo)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios asignados a un usuario específico
	 */
	getEjerciciosByAsignado(asignadoAId: string): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.asignadoAId === asignadoAId)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios asignados a entrenados (todos)
	 */
	getEjerciciosAsignados(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => 
				ejercicio.asignadoAId && ejercicio.asignadoATipo === Rol.ENTRENADO
			)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios sin asignar
	 */
	getEjerciciosSinAsignar(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => !ejercicio.asignadoAId)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios creados por entrenados
	 */
	getEjerciciosCreadosPorEntrenados(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.creadorTipo === Rol.ENTRENADO)
		);
	}

	/**
	 * 🔍 Obtiene ejercicios creados por entrenadores
	 */
	getEjerciciosCreadosPorEntrenadores(): Signal<Ejercicio[]> {
		return computed(() => 
			this._ejercicios().filter(ejercicio => ejercicio.creadorTipo === Rol.ENTRENADOR)
		);
	}

	/**
	 * ✅ Verifica si un rol puede crear ejercicios
	 */
	static canCreateEjercicio(rol: Rol): boolean {
		return rol === Rol.ENTRENADO || rol === Rol.ENTRENADOR;
	}

	/**
	 * ✅ Verifica si un rol puede ser asignado a un ejercicio
	 */
	static canBeAssignedToEjercicio(rol: Rol): boolean {
		return rol === Rol.ENTRENADO;
	}

	/**
	 * 📋 Obtiene los roles que pueden crear ejercicios
	 */
	static getRolesCreadores(): Rol[] {
		return [Rol.ENTRENADO, Rol.ENTRENADOR];
	}

	/**
	 * 📋 Obtiene los roles que pueden ser asignados a ejercicios
	 */
	static getRolesAsignables(): Rol[] {
		return [Rol.ENTRENADO];
	}
}
