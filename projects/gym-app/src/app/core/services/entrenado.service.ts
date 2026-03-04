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
    where,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { Entrenado } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class EntrenadoService {
    private readonly firestore = inject(FIRESTORE);
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
            const col = collection(this.firestore, this.COLLECTION);
            onSnapshot(col, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
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
            onSnapshot(entrenadoRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        entrenadoSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
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
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(entrenado);
            if (entrenado.id) {
                const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
                await setDoc(entrenadoRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, dataToSave);
                entrenado.id = docRef.id;
            }
        });
    }

    /**
     * 🗑️ Elimina un entrenado por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(entrenadoRef);
        });
    }

    /**
     * 👥 Sigue a un usuario
     */
    async followUser(currentUserId: string, targetUserId: string): Promise<void> {
        return this.runInZone(async () => {
            const currentUserRef = doc(this.firestore, this.COLLECTION, currentUserId);
            const targetUserRef = doc(this.firestore, this.COLLECTION, targetUserId);

            // Añadir al target a mis seguidos
            await updateDoc(currentUserRef, {
                seguidos: arrayUnion(targetUserId)
            });

            // Añadirme a los seguidores del target
            await updateDoc(targetUserRef, {
                seguidores: arrayUnion(currentUserId)
            });
        });
    }

    /**
     * 👥 Deja de seguir a un usuario
     */
    async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
        return this.runInZone(async () => {
            const currentUserRef = doc(this.firestore, this.COLLECTION, currentUserId);
            const targetUserRef = doc(this.firestore, this.COLLECTION, targetUserId);

            // Quitar al target de mis seguidos
            await updateDoc(currentUserRef, {
                seguidos: arrayRemove(targetUserId)
            });

            // Quitarme de los seguidores del target
            await updateDoc(targetUserRef, {
                seguidores: arrayRemove(currentUserId)
            });
        });
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
     * NOTA: Este método ahora usa RutinaAsignadaService. Implementar cuando esté disponible.
     */
    getEntrenadosByRutinaAsignada(rutinaId: string): Signal<Entrenado[]> {
        // TODO: Implementar usando RutinaAsignadaService
        return computed(() => []);
    }    /**
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

    private mapFromFirestore(data: any): Entrenado {
        return {
            id: data.id,
            fechaRegistro: data.fechaRegistro instanceof Timestamp ? data.fechaRegistro.toDate() : (data.fechaRegistro instanceof Date ? data.fechaRegistro : new Date()),
            objetivo: data.objetivo || null,
            entrenadoresId: data.entrenadoresId || [],
            rutinasAsignadasIds: data.rutinasAsignadasIds || [],
            rutinasCreadas: data.rutinasCreadas || [],
            nivel: data.nivel || null,
            seguidores: data.seguidores || [],
            seguidos: data.seguidos || []
        };
    }

    private mapToFirestore(entrenado: Entrenado): any {
        const data: any = {};
        if (entrenado.objetivo !== undefined) data.objetivo = entrenado.objetivo;
        if (entrenado.fechaRegistro) {
            data.fechaRegistro = entrenado.fechaRegistro instanceof Date ? Timestamp.fromDate(entrenado.fechaRegistro) : entrenado.fechaRegistro;
        }
        if (entrenado.entrenadoresId) data.entrenadoresId = entrenado.entrenadoresId;
        if (entrenado.rutinasAsignadasIds) data.rutinasAsignadasIds = entrenado.rutinasAsignadasIds;
        if (entrenado.rutinasCreadas) data.rutinasCreadas = entrenado.rutinasCreadas;
        if (entrenado.nivel !== undefined) data.nivel = entrenado.nivel;
        if (entrenado.seguidores) data.seguidores = entrenado.seguidores;
        if (entrenado.seguidos) data.seguidos = entrenado.seguidos;
        return data;
    }
}

