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
    Timestamp,
    query,
    where
} from 'firebase/firestore';
import { Gimnasio } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class GimnasioService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'gimnasios';

    private readonly _gimnasios: WritableSignal<Gimnasio[]> = signal<Gimnasio[]>([]);
    private readonly gimnasioSignals = new Map<string, WritableSignal<Gimnasio | null>>();
    private isListenerInitialized = false;

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
     * 🔄 Inicializa el listener de gimnasios
     */
    initializeListener(): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            onSnapshot(col, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._gimnasios.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de gimnasios:', e);
        }
    }

    /**
     * 📊 Signal readonly con todos los gimnasios
     */
    get gimnasios(): Signal<Gimnasio[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._gimnasios.asReadonly();
    }

    /**
     * 📊 Obtiene un gimnasio específico por ID
     */
    getGimnasio(id: string): Signal<Gimnasio | null> {
        if (!this.gimnasioSignals.has(id)) {
            const gimnasioSignal = signal<Gimnasio | null>(null);
            this.gimnasioSignals.set(id, gimnasioSignal);

            const gimnasioRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(gimnasioRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        gimnasioSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        gimnasioSignal.set(null);
                    }
                });
            });
        }
        return this.gimnasioSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un gimnasio (upsert si tiene id)
     */
    async save(gimnasio: Gimnasio): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(gimnasio);
            if (gimnasio.id) {
                const gimnasioRef = doc(this.firestore, this.COLLECTION, gimnasio.id);
                await setDoc(gimnasioRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                await addDoc(col, dataToSave);
            }
        });
    }

    /**
     * 🗑️ Elimina un gimnasio por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const gimnasioRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(gimnasioRef);
        });
    }

    /**
     * 🔍 Obtiene un gimnasio específico por ID
     */
    getGimnasioById(id: string): Signal<Gimnasio | null> {
        return computed(() =>
            this._gimnasios().find(gimnasio => gimnasio.id === id) || null
        );
    }

    /**
     * 🔍 Busca gimnasios activos
     */
    getGimnasiosActivos(): Signal<Gimnasio[]> {
        return computed(() =>
            this._gimnasios().filter(gimnasio => gimnasio.activo)
        );
    }

    /**
     * 🔍 Busca gimnasios por dirección
     */
    getGimnasiosByDireccion(direccion: string): Signal<Gimnasio[]> {
        return computed(() =>
            this._gimnasios().filter(gimnasio =>
                gimnasio.direccion.toLowerCase().includes(direccion.toLowerCase())
            )
        );
    }

    /**
     * 📊 Obtiene el conteo total de gimnasios
     */
    get gimnasioCount(): Signal<number> {
        return computed(() => this._gimnasios().length);
    }

    /**
     * 📊 Obtiene el conteo de gimnasios activos
     */
    get gimnasioActivoCount(): Signal<number> {
        return computed(() =>
            this._gimnasios().filter(gimnasio => gimnasio.activo).length
        );
    }

    private mapToFirestore(gimnasio: Gimnasio): any {
        return { ...gimnasio };
    }

    private mapFromFirestore(data: any): Gimnasio {
        return { ...data } as Gimnasio;
    }
}
