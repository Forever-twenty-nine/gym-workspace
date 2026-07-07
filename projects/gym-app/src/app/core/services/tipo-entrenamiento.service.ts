import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
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
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TipoEntrenamientoService {
    private readonly firestore = inject(FIRESTORE);
    private readonly authService = inject(AuthService);
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
     * Guarda un tipo de entrenamiento (nuevo o edición) aplicando las reglas de negocio.
     */
    async guardarTipo(nombre: string, tipoActual?: TipoEntrenamiento | null): Promise<void> {
        const user = this.authService.currentUser();
        if (!user) throw new Error('Usuario no autenticado');
        const gymId = user.gimnasioId || user.uid;

        const duplicate = this.tipos().some((t) => t.nombre.toLowerCase() === nombre.toLowerCase() && (!tipoActual || t.id !== tipoActual.id));
        if (duplicate) {
            throw new Error('Este tipo de entrenamiento ya existe');
        }

        if (!tipoActual) {
            const nuevoTipo: TipoEntrenamiento = {
                id: '',
                nombre,
                gimnasioId: gymId,
                creadoPor: user.uid,
                fechaCreacion: new Date()
            };
            await this.save(nuevoTipo);
        } else {
            const tipoActualizado: TipoEntrenamiento = {
                ...tipoActual,
                nombre
            };
            await this.save(tipoActualizado);
        }
    }

    /**
     * Carga tipos predeterminados si la lista está vacía.
     */
    async cargarPredeterminadosParaUsuarioActual(): Promise<void> {
        const user = this.authService.currentUser();
        if (!user) throw new Error('Usuario no autenticado');
        const gymId = user.gimnasioId || user.uid;
        await this.loadDefaultTypes(gymId, user.uid);
    }

    async loadDefaultTypes(gymId: string, userId: string = ''): Promise<void> {
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
                creadoPor: userId,
                fechaCreacion: new Date()
            });
        }
    }

    private mapFromFirestore(data: any): TipoEntrenamiento {
        return {
            id: data.id,
            nombre: data.nombre || '',
            gimnasioId: data.gimnasioId || '',
            creadoPor: data.creadoPor,
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date())
        };
    }

    private mapToFirestore(tipo: TipoEntrenamiento): any {
        const data: any = {
            nombre: tipo.nombre,
            gimnasioId: tipo.gimnasioId
        };
        if (tipo.creadoPor) {
            data.creadoPor = tipo.creadoPor;
        }
        if (tipo.fechaCreacion) {
            data.fechaCreacion = tipo.fechaCreacion instanceof Date ? Timestamp.fromDate(tipo.fechaCreacion) : tipo.fechaCreacion;
        } else {
            data.fechaCreacion = Timestamp.fromDate(new Date());
        }
        return data;
    }
}
