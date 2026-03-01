import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    onSnapshot,
    query,
    orderBy
} from 'firebase/firestore';
import { Gimnasio } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

@Injectable({ providedIn: 'root' })
export class GimnasioService {
    private readonly firestore = inject(FIRESTORE);

    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly collectionName = 'gimnasios';

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
     * 📡 Inicializa el listener de gimnasios
     */
    initializeListener(): void {
        if (this.isListenerInitialized) return;

        const gimnasiosCollection = collection(this.firestore, this.collectionName);
        const gimnasiosQuery = query(gimnasiosCollection, orderBy('nombre', 'asc'));

        onSnapshot(gimnasiosQuery, (snapshot) => {
            this.runInZone(() => {
                const gimnasios: Gimnasio[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data) {
                        gimnasios.push({
                            id: doc.id,
                            nombre: data['nombre'] || '',
                            direccion: data['direccion'] || '',
                            activo: data['activo'] || false
                        });
                    }
                });

                this._gimnasios.set(gimnasios);
            });
        });
        this.isListenerInitialized = true;
    }

    /**
     * 📊 Signal readonly con todos los gimnasios
     */
    get gimnasios(): Signal<Gimnasio[]> {
        return this._gimnasios.asReadonly();
    }

    /**
     * 📊 Obtiene un gimnasio específico por ID
     */
    getGimnasio(id: string): Signal<Gimnasio | null> {
        if (!this.gimnasioSignals.has(id)) {
            const gimnasioSignal = signal<Gimnasio | null>(null);
            this.gimnasioSignals.set(id, gimnasioSignal);

            const gimnasioRef = doc(this.firestore, this.collectionName, id);
            onSnapshot(gimnasioRef, (docSnap) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        gimnasioSignal.set({
                            id: docSnap.id,
                            nombre: data['nombre'] || '',
                            direccion: data['direccion'] || '',
                            activo: data['activo'] || false
                        });
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
            try {
                const gimnasioData: any = {
                    activo: gimnasio.activo
                };

                if (gimnasio.nombre !== undefined && gimnasio.nombre !== null) {
                    gimnasioData.nombre = gimnasio.nombre;
                }

                if (gimnasio.direccion !== undefined && gimnasio.direccion !== null) {
                    gimnasioData.direccion = gimnasio.direccion;
                }

                if (gimnasio.id) {
                    const gimnasioRef = doc(this.firestore, this.collectionName, gimnasio.id);
                    await setDoc(gimnasioRef, gimnasioData);
                } else {
                    const gimnasiosCollection = collection(this.firestore, this.collectionName);
                    await addDoc(gimnasiosCollection, gimnasioData);
                }
            } catch (error) {
                console.error('Error al guardar gimnasio:', error);
                throw error;
            }
        });
    }

    /**
     * 🗑️ Elimina un gimnasio por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            try {
                const gimnasioRef = doc(this.firestore, this.collectionName, id);
                await deleteDoc(gimnasioRef);
            } catch (error) {
                console.error('Error al eliminar gimnasio:', error);
                throw error;
            }
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
}
