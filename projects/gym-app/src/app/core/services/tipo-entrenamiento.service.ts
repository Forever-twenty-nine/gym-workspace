import { Injectable, signal, WritableSignal, Signal, computed, inject } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    QuerySnapshot,
    DocumentSnapshot
} from 'firebase/firestore';
import { TipoEntrenamiento } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class TipoEntrenamientoService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'tipos-entrenamiento';

    private readonly _tipos: WritableSignal<TipoEntrenamiento[]> = signal<TipoEntrenamiento[]>([]);
    private isListenerInitialized = false;
    private currentGymId: string | null = null;
    private unsubscribeListener?: () => void;

    constructor() { }

    /**
     * Inicializa listener para un gimnasio en específico.
     */
    initializeListener(gymId: string): void {
        if (this.isListenerInitialized && this.currentGymId === gymId) return;

        // Limpiar listener anterior si cambia de gimnasio
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
            this.isListenerInitialized = false;
        }

        try {
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, where('gimnasioId', '==', gymId));

            this.unsubscribeListener = onSnapshot(q, (snap: QuerySnapshot) => {
                const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                this._tipos.set(list);
            });
            this.currentGymId = gymId;
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de tipos de entrenamiento:', e);
        }
    }

    get tipos(): Signal<TipoEntrenamiento[]> {
        return this._tipos.asReadonly();
    }

    async save(tipo: TipoEntrenamiento): Promise<void> {
        const dataToSave = this.mapToFirestore(tipo);
        if (tipo.id && !tipo.id.startsWith('temp-') && tipo.id !== '') {
            const docRef = doc(this.firestore, this.COLLECTION, tipo.id);
            await setDoc(docRef, dataToSave, { merge: true });
        } else {
            const col = collection(this.firestore, this.COLLECTION);
            const docRef = await addDoc(col, dataToSave);
            tipo.id = docRef.id;
        }
    }

    async delete(id: string): Promise<void> {
        const docRef = doc(this.firestore, this.COLLECTION, id);
        await deleteDoc(docRef);
    }

    /**
     * Carga tipos predeterminados si la lista está vacía.
     */
    async loadDefaultTypes(gymId: string): Promise<void> {
        const defaultNames = [
            'WOD del Día',
            'Entrenamiento Semanal',
            'Fuerza y Técnica',
            'Cardio Acondicionamiento',
            'Clase Especial'
        ];
        for (const name of defaultNames) {
            await this.save({
                id: '',
                nombre: name,
                gimnasioId: gymId,
                fechaCreacion: new Date()
            });
        }
    }

    private mapFromFirestore(data: any): TipoEntrenamiento {
        return {
            id: data.id,
            nombre: data.nombre || '',
            gimnasioId: data.gimnasioId || '',
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date())
        };
    }

    private mapToFirestore(tipo: TipoEntrenamiento): any {
        const data: any = {
            nombre: tipo.nombre,
            gimnasioId: tipo.gimnasioId
        };
        if (tipo.fechaCreacion) {
            data.fechaCreacion = tipo.fechaCreacion instanceof Date ? Timestamp.fromDate(tipo.fechaCreacion) : tipo.fechaCreacion;
        } else {
            data.fechaCreacion = Timestamp.fromDate(new Date());
        }
        return data;
    }
}
