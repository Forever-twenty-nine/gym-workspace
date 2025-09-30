import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Ejercicio } from '../models/ejercicio.model';

export interface IEjercicioFirestoreAdapter {
  initializeListener(onUpdate: (ejercicios: Ejercicio[]) => void): void;
  subscribeToEjercicio(id: string, onUpdate: (ejercicio: Ejercicio | null) => void): void;
  save(ejercicio: Ejercicio): Promise<void>;
  delete(id: string): Promise<void>;
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
	 * 💾 Guarda o actualiza un ejercicio (upsert si tiene id).
	 */
	async save(ejercicio: Ejercicio): Promise<void> {
		if (!this.firestoreAdapter) {
			throw new Error('Firestore adapter no configurado');
		}
		
		try {
			await this.firestoreAdapter.save(ejercicio);
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
}