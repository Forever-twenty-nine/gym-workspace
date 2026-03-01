import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
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
    DocumentSnapshot,
    deleteField
} from '@angular/fire/firestore';
import { Entrenado } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';

@Injectable({ providedIn: 'root' })
export class EntrenadoService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'entrenados';

    // Señal que contiene la lista de entrenados (reactiva)
    private readonly _entrenados: WritableSignal<Entrenado[]> = signal<Entrenado[]>([]);
    private readonly entrenadoSignals = new Map<string, WritableSignal<Entrenado | null>>();
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
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    initializeListener(): void {
        if (this.isListenerInitialized) return;

        try {
            const entrenadosCol = collection(this.firestore, this.COLLECTION);

            onSnapshot(entrenadosCol, (snapshot: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._entrenados.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de entrenados:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de entrenados
     */
    get entrenados(): Signal<Entrenado[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._entrenados.asReadonly();
    }

    /**
     * 📊 Obtiene un entrenado específico por ID
     */
    getEntrenado(id: string): Signal<Entrenado | null> {
        if (!this.entrenadoSignals.has(id)) {
            const entrenadoSignal = signal<Entrenado | null>(null);
            this.entrenadoSignals.set(id, entrenadoSignal);

            const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(entrenadoRef, (snapshot: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (snapshot.exists()) {
                        entrenadoSignal.set(this.mapFromFirestore({ ...snapshot.data(), id: snapshot.id }));
                    } else {
                        entrenadoSignal.set(null);
                    }
                });
            });
        }
        return this.entrenadoSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un entrenado (upsert si tiene id)
     */
    async save(entrenado: Entrenado): Promise<void> {
        try {
            await this.runInZone(async () => {
                const dataToSave = this.mapToFirestore(entrenado);

                if (entrenado.id) {
                    const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
                    await setDoc(entrenadoRef, dataToSave, { merge: true });
                } else {
                    await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
                }
            });

            // Actualizar el signal local inmediatamente para reactividad
            const entrenadosActuales = this._entrenados();
            const index = entrenadosActuales.findIndex(e => e.id === entrenado.id);

            if (index >= 0) {
                // Actualizar existente
                entrenadosActuales[index] = { ...entrenado };
            } else {
                // Agregar nuevo
                entrenadosActuales.push(entrenado);
            }

            this._entrenados.set([...entrenadosActuales]);
        } catch (error) {
            console.error('Error al guardar entrenado:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina un entrenado por ID
     */
    async delete(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
                await deleteDoc(entrenadoRef);
            });
        } catch (error) {
            console.error('Error al eliminar entrenado:', error);
            throw error;
        }
    }

    /**
     * 🔍 Busca entrenados por ID
     */
    getEntrenadoById(id: string): Signal<Entrenado | null> {
        return computed(() =>
            this._entrenados().find(entrenado => entrenado.id === id) || null
        );
    }

    /**
     * 🔍 Busca entrenados por objetivo
     */
    getEntrenadosByObjetivo(objetivo: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.objetivo === objetivo
            )
        );
    }

    /**
     * 🔍 Busca entrenados por entrenador
     */
    getEntrenadosByEntrenador(entrenadorId: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.entrenadoresId?.includes(entrenadorId)
            )
        );
    }

    /**
     * 🔍 Busca entrenados que tienen una rutina asignada específica
     */
    getEntrenadosByRutinaAsignada(rutinaId: string): Signal<Entrenado[]> {
        return computed(() => []);
    }

    /**
     * 🔍 Busca entrenados que han creado una rutina específica
     */
    getEntrenadosByRutinaCreada(rutinaId: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.rutinasCreadas?.includes(rutinaId)
            )
        );
    }

    /**
     * 📊 Obtiene entrenados activos
     */
    getEntrenadosActivos(): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados()
        );
    }

    /**
     * 📊 Obtiene el conteo total de entrenados
     */
    get entrenadoCount(): Signal<number> {
        return computed(() => this._entrenados().length);
    }

    /**
     * 📊 Obtiene el conteo de entrenados activos
     */
    get entrenadoActivoCount(): Signal<number> {
        return computed(() => this._entrenados().length);
    }

    /**
     * 🔄 Mapea datos de Firestore a modelo Entrenado
     */
    private mapFromFirestore(data: any): Entrenado {
        return {
            id: data.id,
            entrenadoresId: data.entrenadoresId || [],
            rutinasAsignadasIds: data.rutinasAsignadasIds || [],
            rutinasCreadas: data.rutinasCreadas || [],
            fechaRegistro: data.fechaRegistro?.toDate?.() || data.fechaRegistro || new Date(),
            objetivo: data.objetivo || undefined
        };
    }

    /**
     * 🔄 Mapea modelo Entrenado a datos de Firestore
     */
    private mapToFirestore(entrenado: Entrenado): any {
        const data: any = {};

        if (entrenado.entrenadoresId !== undefined) {
            data.entrenadoresId = entrenado.entrenadoresId !== null ? entrenado.entrenadoresId : deleteField();
        }

        if (entrenado.rutinasAsignadasIds !== undefined) {
            data.rutinasAsignadasIds = entrenado.rutinasAsignadasIds !== null ? entrenado.rutinasAsignadasIds : deleteField();
        }

        if (entrenado.rutinasCreadas !== undefined) {
            data.rutinasCreadas = entrenado.rutinasCreadas !== null ? entrenado.rutinasCreadas : deleteField();
        }

        if (entrenado.objetivo !== undefined) {
            data.objetivo = entrenado.objetivo !== null ? entrenado.objetivo : deleteField();
        }

        if (entrenado.fechaRegistro) {
            data.fechaRegistro = entrenado.fechaRegistro instanceof Date
                ? Timestamp.fromDate(entrenado.fechaRegistro)
                : entrenado.fechaRegistro;
        }

        return data;
    }
}

