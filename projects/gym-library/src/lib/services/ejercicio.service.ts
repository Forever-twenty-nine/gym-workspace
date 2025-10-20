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

	// Función genérica para filtrar por rango numérico
	private filterByRange<T>(items: T[], getValue: (item: T) => number, min: number, max?: number): T[] {
		return items.filter(item => {
			const value = getValue(item);
			if (max !== undefined) {
				return value >= min && value <= max;
			}
			return value >= min;
		});
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
		// Validación 1: Valores numéricos positivos
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

		// Limpiar strings vacíos
		if (!normalized.nombre || normalized.nombre.trim() === '') {
			throw new EjercicioValidationError('El nombre del ejercicio es obligatorio');
		}
		normalized.nombre = normalized.nombre.trim();
		if (normalized.descripcion) {
			normalized.descripcion = normalized.descripcion.trim();
			if (normalized.descripcion === '') {
				delete normalized.descripcion;
			}
		}

		// Eliminar campos opcionales que sean undefined para evitar errores en Firestore
		if (normalized.peso === undefined) delete normalized.peso;
		if (normalized.descansoSegundos === undefined) delete normalized.descansoSegundos;
		if (normalized.serieSegundos === undefined) delete normalized.serieSegundos;
		if (normalized.fechaCreacion === undefined) delete normalized.fechaCreacion;
		if (normalized.fechaModificacion === undefined) delete normalized.fechaModificacion;

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
			this.filterByRange(this._ejercicios(), e => e.series, minSeries, maxSeries)
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
			this.filterByRange(this._ejercicios(), e => e.repeticiones, minReps, maxReps)
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
	 * ✅ Verifica si un rol puede crear ejercicios
	 */
	static canCreateEjercicio(rol: Rol): boolean {
		return rol === Rol.ENTRENADO || rol === Rol.ENTRENADOR;
	}

	/**
	 * 📋 Obtiene los roles que pueden crear ejercicios
	 */
	static getRolesCreadores(): Rol[] {
		return [Rol.ENTRENADO, Rol.ENTRENADOR];
	}
}
