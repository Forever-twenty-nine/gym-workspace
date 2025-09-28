import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Ejercicio } from '../models/ejercicio.model';

@Injectable({ providedIn: 'root' })
export class EjercicioService {
	private readonly COLLECTION = 'ejercicios';
	private firestore = inject(Firestore);

	private readonly _ejercicios: WritableSignal<Ejercicio[]> = signal<Ejercicio[]>([]);
	private readonly ejercicioSignals = new Map<string, WritableSignal<Ejercicio | null>>();
	private isListenerInitialized = false;

	constructor() {
		// 🔧 Inicializar el listener de forma diferida
		this.initializeListener();
	}

	/**
	 * 🔄 Inicializa el listener de Firestore de forma segura
	 */
	private initializeListener(): void {
		if (this.isListenerInitialized) return;
		
		try {
			const col = collection(this.firestore, this.COLLECTION);
			onSnapshot(col, (snap: QuerySnapshot) => {
				const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
				this._ejercicios.set(list);
			});
			this.isListenerInitialized = true;
		} catch (e) {
			console.warn('Error inicializando listener de ejercicios:', e);
		}
	}

	/**
	 * Guarda o actualiza un ejercicio (upsert si tiene id).
	 * @param e El ejercicio a guardar.
	 */
	async guardarEjercicio(ejercicio: Ejercicio): Promise<void> {
		const col = collection(this.firestore, this.COLLECTION);
		const data = { ...ejercicio } as any;

		if (ejercicio.id) {
			const docRef = doc(this.firestore, `${this.COLLECTION}/${ejercicio.id}`);
			await setDoc(docRef, data, { merge: true });
			return;
		}

		await addDoc(col, data);
	}

	/**
	 * 📜 Señal readonly con todos los ejercicios.
	 */
	obtenerEjercicios(): Signal<Ejercicio[]> {
		return this._ejercicios.asReadonly();
	}

	/**
	 * 🔎 Señal readonly de un ejercicio por id.
	 */
	obtenerEjercicioPorId(id: string): Signal<Ejercicio | null> {
		if (!this.ejercicioSignals.has(id)) {
			const s = signal<Ejercicio | null>(null);
			this.ejercicioSignals.set(id, s);

			try {
				const docRef = doc(this.firestore, `${this.COLLECTION}/${id}`);
				onSnapshot(docRef, (snap: DocumentSnapshot) => {
					if (snap.exists()) {
						s.set(this.mapFromFirestore({ ...snap.data(), id: snap.id }));
					} else {
						s.set(null);
					}
				});
			} catch (e) {
				console.warn(`Error obteniendo ejercicio ${id}:`, e);
				s.set(null);
			}
		}
		return this.ejercicioSignals.get(id)!.asReadonly();
	}

	/**
	 * ❌ Elimina un ejercicio por id.
	 */
	async eliminarEjercicio(id: string): Promise<void> {
		const docRef = doc(this.firestore, `${this.COLLECTION}/${id}`);
		await deleteDoc(docRef);
	}

	private mapFromFirestore(raw: any): Ejercicio {
		return {
			id: raw.id,
			nombre: raw.nombre,
			descripcion: raw.descripcion,
			series: raw.series,
			repeticiones: raw.repeticiones,
			peso: raw.peso,
			descansoSegundos: raw.descansoSegundos,
			serieSegundos: raw.serieSegundos
		} as Ejercicio;
	}
}
