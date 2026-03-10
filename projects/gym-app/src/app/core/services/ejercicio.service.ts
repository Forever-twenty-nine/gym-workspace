import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
	Firestore,
	collection,
	addDoc,
	doc,
	deleteDoc,
	setDoc,
	onSnapshot,
	QuerySnapshot,
	DocumentSnapshot,
	Timestamp
} from 'firebase/firestore';
import { Ejercicio, Rol } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

/**
 * Errores de validación personalizados
 */
export class EjercicioValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'EjercicioValidationError';
	}
}

@Injectable({ providedIn: 'root' })
export class EjercicioService {
	private readonly firestore = inject(FIRESTORE);

	private readonly injector = inject(Injector);
	private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
	private readonly COLLECTION = 'ejercicios';

	private readonly _ejercicios: WritableSignal<Ejercicio[]> = signal<Ejercicio[]>([]);
	private readonly ejercicioSignals = new Map<string, WritableSignal<Ejercicio | null>>();
	private readonly isSubscribed = new Map<string, boolean>();
	private readonly computedFilters = new Map<string, Signal<Ejercicio[]>>();
	private isListenerInitialized = false;

	private filterByRange<T>(items: T[], getValue: (item: T) => number, min: number, max?: number): T[] {
		return items.filter(item => {
			const value = getValue(item);
			if (max !== undefined) {
				return value >= min && value <= max;
			}
			return value >= min;
		});
	}

	constructor() { }

	/**
	 * Ejecuta el callback en el contexto correcto (zona o inyección)
	 */
	private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
		if (this.zoneRunner) {
			return this.zoneRunner.run(callback);
		}
		return runInInjectionContext(this.injector, callback as any);
	}

	/**
	 * Inicializa el listener de Firestore de forma segura
	 */
	private initializeListener(): void {
		if (this.isListenerInitialized) return;

		try {
			const col = collection(this.firestore, this.COLLECTION);
			onSnapshot(col, (snap: QuerySnapshot) => {
				this.runInZone(() => {
					const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
					this._ejercicios.set(list);
				});
			});
			this.isListenerInitialized = true;
		} catch (e) {
			console.warn('Error inicializando listener de ejercicios:', e);
		}
	}

	/**
	 * Signal readonly con todos los ejercicios
	 */
	get ejercicios(): Signal<Ejercicio[]> {
		if (!this.isListenerInitialized) {
			this.initializeListener();
		}
		return this._ejercicios.asReadonly();
	}

	/**
	 * Obtiene un ejercicio específico por ID
	 */
	getEjercicio(id: string): Signal<Ejercicio | null> {
		if (!this.ejercicioSignals.has(id)) {
			const ejercicioSignal = signal<Ejercicio | null>(null);
			this.ejercicioSignals.set(id, ejercicioSignal);
			this.isSubscribed.set(id, false);

			const ejercicioRef = doc(this.firestore, this.COLLECTION, id);
			onSnapshot(ejercicioRef, (docSnap: DocumentSnapshot) => {
				this.runInZone(() => {
					if (docSnap.exists()) {
						ejercicioSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
					} else {
						ejercicioSignal.set(null);
					}
					this.isSubscribed.set(id, true);
				});
			});
		}
		return this.ejercicioSignals.get(id)!.asReadonly();
	}

	/**
	 * Valida las reglas de negocio del ejercicio
	 * @throws {EjercicioValidationError} Si la validación falla
	 */
	validateEjercicio(ejercicio: Ejercicio): void {
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
	 * Normaliza y limpia el ejercicio antes de guardar
	 */
	private normalizeEjercicio(ejercicio: Ejercicio): Ejercicio {
		const normalized: any = { ...ejercicio };

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

		// Eliminar cualquier campo undefined para evitar errores en Firestore
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
	 * Guarda o actualiza un ejercicio (upsert si tiene id). Aplica validaciones y normalización automáticamente.
	 * @throws {EjercicioValidationError} Si la validación falla
	 */
	async save(ejercicio: Ejercicio): Promise<void> {
		const normalizedEjercicio = this.normalizeEjercicio(ejercicio);
		this.validateEjercicio(normalizedEjercicio);

		return this.runInZone(async () => {
			const dataToSave = this.mapToFirestore(normalizedEjercicio);
			if (normalizedEjercicio.id) {
				const ejercicioRef = doc(this.firestore, this.COLLECTION, normalizedEjercicio.id);
				await setDoc(ejercicioRef, dataToSave, { merge: true });
			} else {
				const col = collection(this.firestore, this.COLLECTION);
				await addDoc(col, dataToSave);
			}
		});
	}

	/**
	 * Elimina un ejercicio por ID
	 */
	async delete(id: string): Promise<void> {
		return this.runInZone(async () => {
			const ejercicioRef = doc(this.firestore, this.COLLECTION, id);
			await deleteDoc(ejercicioRef);
		});
	}

	/**
	 * Busca ejercicios por nombre
	 */
	getEjerciciosByNombre(nombre: string): Signal<Ejercicio[]> {
		const key = `nombre-${nombre}`;
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this._ejercicios().filter(ejercicio =>
					ejercicio.nombre.toLowerCase().includes(nombre.toLowerCase())
				)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Busca ejercicios por descripción
	 */
	getEjerciciosByDescripcion(descripcion: string): Signal<Ejercicio[]> {
		const key = `descripcion-${descripcion}`;
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this._ejercicios().filter(ejercicio =>
					ejercicio.descripcion?.toLowerCase().includes(descripcion.toLowerCase())
				)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Busca ejercicios por rango de series
	 */
	getEjerciciosBySeries(minSeries: number, maxSeries?: number): Signal<Ejercicio[]> {
		const key = `series-${minSeries}-${maxSeries || 'max'}`;
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this.filterByRange(this._ejercicios(), e => e.series, minSeries, maxSeries)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Obtiene el conteo total de ejercicios
	 */
	get ejercicioCount(): Signal<number> {
		return computed(() => this._ejercicios().length);
	}

	/**
	 * Busca ejercicios por rango de repeticiones
	 */
	getEjerciciosByRepeticiones(minReps: number, maxReps?: number): Signal<Ejercicio[]> {
		const key = `repeticiones-${minReps}-${maxReps || 'max'}`;
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this.filterByRange(this._ejercicios(), e => e.repeticiones, minReps, maxReps)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Obtiene ejercicios con peso específico
	 */
	getEjerciciosConPeso(): Signal<Ejercicio[]> {
		const key = 'con-peso';
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this._ejercicios().filter(ejercicio => ejercicio.peso && ejercicio.peso > 0)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Obtiene ejercicios sin peso (peso corporal)
	 */
	getEjerciciosSinPeso(): Signal<Ejercicio[]> {
		const key = 'sin-peso';
		if (!this.computedFilters.has(key)) {
			this.computedFilters.set(key, computed(() =>
				this._ejercicios().filter(ejercicio => !ejercicio.peso || ejercicio.peso === 0)
			));
		}
		return this.computedFilters.get(key)!;
	}

	/**
	 * Verifica si un rol puede crear ejercicios
	 */
	static canCreateEjercicio(rol: Rol): boolean {
		return rol === Rol.ENTRENADO || rol === Rol.ENTRENADOR;
	}

	/**
	 * Obtiene los roles que pueden crear ejercicios
	 */
	static getRolesCreadores(): Rol[] {
		return [Rol.ENTRENADO, Rol.ENTRENADOR];
	}

	private mapFromFirestore(data: any): Ejercicio {
		return {
			id: data.id,
			nombre: data.nombre || '',
			descripcion: data.descripcion,
			series: data.series || 0,
			repeticiones: data.repeticiones || 0,
			peso: data.peso,
			descansoSegundos: data.descansoSegundos,
			serieSegundos: data.serieSegundos,
			fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : data.fechaCreacion,
			fechaModificacion: data.fechaModificacion instanceof Timestamp ? data.fechaModificacion.toDate() : data.fechaModificacion,
			creadorId: data.creadorId
		};
	}

	private mapToFirestore(ejercicio: Ejercicio): any {
		const data: any = {
			nombre: ejercicio.nombre,
			descripcion: ejercicio.descripcion || null,
			series: ejercicio.series,
			repeticiones: ejercicio.repeticiones
		};

		if (ejercicio.peso !== undefined) data.peso = ejercicio.peso;
		if (ejercicio.descansoSegundos !== undefined) data.descansoSegundos = ejercicio.descansoSegundos;
		if (ejercicio.serieSegundos !== undefined) data.serieSegundos = ejercicio.serieSegundos;
		if (ejercicio.fechaCreacion) data.fechaCreacion = ejercicio.fechaCreacion instanceof Date ? Timestamp.fromDate(ejercicio.fechaCreacion) : ejercicio.fechaCreacion;
		if (ejercicio.fechaModificacion) data.fechaModificacion = ejercicio.fechaModificacion instanceof Date ? Timestamp.fromDate(ejercicio.fechaModificacion) : ejercicio.fechaModificacion;
		if (ejercicio.creadorId) data.creadorId = ejercicio.creadorId;

		return data;
	}
}

