import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
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
    DocumentSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { Convocatoria } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class ConvocatoriaService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'convocatorias';

    private readonly _convocatorias: WritableSignal<Convocatoria[]> = signal<Convocatoria[]>([]);
    private isListenerInitialized = false;

    constructor() { }

    private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
        if (this.zoneRunner) {
            return this.zoneRunner.run(callback);
        }
        return runInInjectionContext(this.injector, callback as any);
    }

    private initializeListener(): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, where('activo', '==', true));
            onSnapshot(q, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._convocatorias.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de convocatorias:', e);
        }
    }

    get convocatorias(): Signal<Convocatoria[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._convocatorias.asReadonly();
    }

    async save(convocatoria: Convocatoria): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(convocatoria);
            if (convocatoria.id) {
                const docRef = doc(this.firestore, this.COLLECTION, convocatoria.id);
                await setDoc(docRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, dataToSave);
                convocatoria.id = docRef.id;
            }
        });
    }

    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const docRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(docRef);
        });
    }

    async toggleInteres(convocatoriaId: string, userId: string, unirse: boolean): Promise<void> {
        return this.runInZone(async () => {
            const docRef = doc(this.firestore, this.COLLECTION, convocatoriaId);
            if (unirse) {
                await updateDoc(docRef, {
                    interesados: arrayUnion(userId)
                });
            } else {
                await updateDoc(docRef, {
                    interesados: arrayRemove(userId)
                });
            }
        });
    }

    private mapFromFirestore(data: any): Convocatoria {
        return {
            id: data.id,
            creadorId: data.creadorId || '',
            creadorNombre: data.creadorNombre || 'Atleta',
            creadorFoto: data.creadorFoto || null,
            gimnasioId: data.gimnasioId || '',
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
            fechaEntrenamiento: data.fechaEntrenamiento instanceof Timestamp ? data.fechaEntrenamiento.toDate() : (data.fechaEntrenamiento ? new Date(data.fechaEntrenamiento) : new Date()),
            horaInicio: data.horaInicio || '00:00',
            horaFin: data.horaFin || '00:00',
            mensaje: data.mensaje || '',
            interesados: data.interesados || [],
            activo: data.activo ?? true
        };
    }

    private mapToFirestore(convocatoria: Convocatoria): any {
        const data: any = {
            creadorId: convocatoria.creadorId,
            creadorNombre: convocatoria.creadorNombre,
            gimnasioId: convocatoria.gimnasioId,
            horaInicio: convocatoria.horaInicio,
            horaFin: convocatoria.horaFin,
            interesados: convocatoria.interesados || [],
            activo: convocatoria.activo ?? true
        };

        if (convocatoria.creadorFoto !== undefined) data.creadorFoto = convocatoria.creadorFoto;
        if (convocatoria.mensaje !== undefined) data.mensaje = convocatoria.mensaje;
        
        if (convocatoria.fechaCreacion) {
            data.fechaCreacion = convocatoria.fechaCreacion instanceof Date ? Timestamp.fromDate(convocatoria.fechaCreacion) : convocatoria.fechaCreacion;
        }
        if (convocatoria.fechaEntrenamiento) {
            data.fechaEntrenamiento = convocatoria.fechaEntrenamiento instanceof Date ? Timestamp.fromDate(convocatoria.fechaEntrenamiento) : convocatoria.fechaEntrenamiento;
        }

        return data;
    }
}
