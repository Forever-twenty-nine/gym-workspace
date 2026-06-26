import { Injectable, signal, WritableSignal, Signal, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { Comentario } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

@Injectable({ providedIn: 'root' })
export class ComentarioAdminService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'comentarios-social';

    private readonly _comentarios: WritableSignal<Comentario[]> = signal<Comentario[]>([]);
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
            const colRef = collection(this.firestore, this.COLLECTION);
            const q = query(colRef, orderBy('fecha', 'desc'));

            onSnapshot(q, (snapshot) => {
                this.runInZone(() => {
                    const list: Comentario[] = snapshot.docs.map(docSnap => {
                        const data = docSnap.data();
                        return this.mapFromFirestore({ ...data, id: docSnap.id });
                    });
                    this._comentarios.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de comentarios:', e);
        }
    }

    get comentarios(): Signal<Comentario[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._comentarios.asReadonly();
    }

    async eliminarComentario(id: string): Promise<void> {
        return this.runInZone(async () => {
            const ref = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(ref);
        });
    }

    private mapFromFirestore(data: any): Comentario {
        const comentario = {
            ...data,
            fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : (data.fecha ? new Date(data.fecha) : new Date()),
            likes: data.likes || []
        } as Comentario;

        if (comentario.respuesta) {
            comentario.respuesta = {
                ...comentario.respuesta,
                fecha: comentario.respuesta.fecha instanceof Timestamp 
                    ? comentario.respuesta.fecha.toDate() 
                    : (comentario.respuesta.fecha ? new Date(comentario.respuesta.fecha) : new Date())
            };
        }

        return comentario;
    }
}
