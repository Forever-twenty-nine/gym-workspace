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
    DocumentSnapshot
} from 'firebase/firestore';
import { Desafio } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class DesafioService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'desafios';

    private readonly _desafios: WritableSignal<Desafio[]> = signal<Desafio[]>([]);
    private readonly desafioSignals = new Map<string, WritableSignal<Desafio | null>>();
    private isListenerInitialized = false;

    constructor() { }

    private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
        if (this.zoneRunner) {
            return this.zoneRunner.run(callback);
        }
        return runInInjectionContext(this.injector, callback as any);
    }

    /**
     * Inicializa listener.
     * Si se pasa gymId, filtra por gimnasio (recomendado para entrenados/social).
     */
    private initializeListener(gymId?: string): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            let q = query(col, where('activo', '==', true));

            if (gymId) {
                q = query(col, where('activo', '==', true), where('gimnasioId', '==', gymId));
            }

            onSnapshot(q, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._desafios.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de desafios:', e);
        }
    }

    get desafios(): Signal<Desafio[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._desafios.asReadonly();
    }

    /** Versión gym-scoped (mejor para sección de entrenados) */
    getDesafiosForGym(gymId: string): Signal<Desafio[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener(gymId);
        }
        return this._desafios.asReadonly();
    }

    getDesafio(id: string): Signal<Desafio | null> {
        if (!this.desafioSignals.has(id)) {
            const desafioSignal = signal<Desafio | null>(null);
            this.desafioSignals.set(id, desafioSignal);

            const desafioRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(desafioRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        desafioSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        desafioSignal.set(null);
                    }
                });
            });
        }
        return this.desafioSignals.get(id)!.asReadonly();
    }

    async save(desafio: Desafio): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(desafio);
            if (desafio.id) {
                const desafioRef = doc(this.firestore, this.COLLECTION, desafio.id);
                await setDoc(desafioRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, dataToSave);
                desafio.id = docRef.id;
            }
        });
    }

    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const desafioRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(desafioRef);
        });
    }

    getDesafiosByGimnasio(gimnasioId: string): Signal<Desafio[]> {
        return computed(() => {
            const now = new Date();
            return this.desafios().filter(d =>
                d.gimnasioId === gimnasioId &&
                d.activo &&
                new Date(d.fechaVencimiento) > now
            );
        });
    }

    getDesafiosByCreador(creadorId: string): Signal<Desafio[]> {
        return computed(() =>
            this.desafios().filter(d => d.creadorId === creadorId)
        );
    }

    private mapFromFirestore(data: any): Desafio {
        return {
            id: data.id,
            creadorId: data.creadorId || '',
            creadorNombre: data.creadorNombre || '',
            creadorFoto: data.creadorFoto || null,
            gimnasioId: data.gimnasioId || '',
            titulo: data.titulo || '',
            logroRelacionado: data.logroRelacionado || null,
            disciplina: data.disciplina || null,
            fechaCreacion: data.fechaCreacion instanceof Timestamp
                ? data.fechaCreacion.toDate()
                : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
            fechaVencimiento: data.fechaVencimiento instanceof Timestamp
                ? data.fechaVencimiento.toDate()
                : (data.fechaVencimiento ? new Date(data.fechaVencimiento) : new Date()),
            activo: data.activo ?? true
        };
    }

    private mapToFirestore(desafio: Desafio): any {
        const data: any = {
            creadorId: desafio.creadorId,
            creadorNombre: desafio.creadorNombre,
            gimnasioId: desafio.gimnasioId,
            titulo: desafio.titulo,
            activo: desafio.activo ?? true
        };

        if (desafio.creadorFoto) data.creadorFoto = desafio.creadorFoto;
        if (desafio.logroRelacionado) data.logroRelacionado = desafio.logroRelacionado;
        if (desafio.disciplina) data.disciplina = desafio.disciplina;
        if (desafio.fechaCreacion) {
            data.fechaCreacion = desafio.fechaCreacion instanceof Date
                ? Timestamp.fromDate(desafio.fechaCreacion)
                : desafio.fechaCreacion;
        }
        if (desafio.fechaVencimiento) {
            data.fechaVencimiento = desafio.fechaVencimiento instanceof Date
                ? Timestamp.fromDate(desafio.fechaVencimiento)
                : desafio.fechaVencimiento;
        }

        return data;
    }
}
