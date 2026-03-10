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
    Timestamp
} from 'firebase/firestore';
import { Rutina } from 'gym-library';
import { EjercicioService } from './ejercicio.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

export interface RutinaConEjercicios extends Rutina {
    ejercicios: any[]; // Ejercicios ya resueltos
}

@Injectable({ providedIn: 'root' })
export class RutinaService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'rutinas';

    // Señal interna con todas las rutinas
    private readonly _rutinas: WritableSignal<Rutina[]> = signal<Rutina[]>([]);
    private readonly rutinaSignals = new Map<string, WritableSignal<Rutina | null>>();
    private isListenerInitialized = false;

    // Inyectar EjercicioService para combinar datos
    private readonly ejercicioService = inject(EjercicioService);

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
    private initializeListener(): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            onSnapshot(col, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._rutinas.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de rutinas:', e);
        }
    }

    /**
     * 📊 Signal readonly con todas las rutinas
     */
    get rutinas(): Signal<Rutina[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._rutinas.asReadonly();
    }

    /**
     * 📊 Obtiene una rutina específica por ID
     */
    getRutina(id: string): Signal<Rutina | null> {
        if (!this.rutinaSignals.has(id)) {
            const rutinaSignal = signal<Rutina | null>(null);
            this.rutinaSignals.set(id, rutinaSignal);

            const rutinaRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(rutinaRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        rutinaSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        rutinaSignal.set(null);
                    }
                });
            });
        }
        return this.rutinaSignals.get(id)!.asReadonly();
    }

    /**
     * 🛰️ Actualiza el estado de compartir de una rutina
     */
    async setCompartida(id: string, compartida: boolean, userId: string, userName?: string): Promise<void> {
        const rutinaRef = doc(this.firestore, this.COLLECTION, id);
        const data: Partial<Rutina> = {
            compartida,
            usuarioId: userId,
            nombreUsuario: userName,
            fechaCompartida: compartida ? Timestamp.now() : null
        };
        await setDoc(rutinaRef, data, { merge: true });
    }

    /**
     * 💾 Guarda o actualiza una rutina (upsert si tiene id)
     */
    async save(rutina: Rutina): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(rutina);
            if (rutina.id) {
                const rutinaRef = doc(this.firestore, this.COLLECTION, rutina.id);
                await setDoc(rutinaRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, dataToSave);
                rutina.id = docRef.id;
            }
        });
    }

    /**
     * 🗑️ Elimina una rutina por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const rutinaRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(rutinaRef);
        });
    }

    /**
     * 🔍 Busca rutinas por nombre
     */
    getRutinasByNombre(nombre: string): Signal<Rutina[]> {
        return computed(() =>
            this._rutinas().filter(rutina =>
                rutina.nombre.toLowerCase().includes(nombre.toLowerCase())
            )
        );
    }

    /**
     * 🔍 Busca rutinas activas
     */
    getRutinasActivas(): Signal<Rutina[]> {
        return computed(() =>
            this._rutinas().filter(rutina => rutina.activa)
        );
    }

    /**
     * 📊 Obtiene el conteo total de rutinas
     */
    get rutinaCount(): Signal<number> {
        return computed(() => this._rutinas().length);
    }

    /**
     * 📊 Obtiene el conteo de rutinas activas
     */
    get rutinaActivaCount(): Signal<number> {
        return computed(() => this._rutinas().filter(r => r.activa).length);
    }

    /**
     * 🔍 Busca rutinas por duración
     */
    getRutinasByDuracion(duracion: number): Signal<Rutina[]> {
        return computed(() =>
            this._rutinas().filter(rutina =>
                rutina.duracion === duracion
            )
        );
    }

    /**
     * 🔍 Busca rutinas completadas (DEPRECATED - usar ProgresoService)
     * @deprecated El progreso ahora está en el modelo del entrenado
     */
    getRutinasCompletadas(): Signal<Rutina[]> {
        return computed(() => []);
    }

    /**
     * 🎯 Obtiene una rutina con sus ejercicios ya resueltos (más eficiente que hacer llamadas separadas)
     */
    getRutinaConEjercicios(id: string): Signal<RutinaConEjercicios | null> {
        return computed(() => {
            // Obtener la rutina base
            const rutinaSignal = this.getRutina(id);
            const rutina = rutinaSignal();

            if (!rutina || !rutina.ejerciciosIds || !Array.isArray(rutina.ejerciciosIds)) {
                return null;
            }

            // Obtener todos los ejercicios disponibles
            const todosEjercicios = this.ejercicioService.ejercicios();

            // Resolver ejercicios por IDs
            const ejerciciosResueltos = rutina.ejerciciosIds
                .map(id => todosEjercicios.find(e => e && e.id === id))
                .filter(e => e !== undefined); // Filtrar ejercicios no encontrados

            // Retornar rutina con ejercicios incluidos
            return {
                ...rutina,
                ejercicios: ejerciciosResueltos
            } as RutinaConEjercicios;
        });
    }

    private mapFromFirestore(data: any): Rutina {
        return {
            id: data.id,
            nombre: data.nombre || '',
            activa: data.activa ?? true,
            descripcion: data.descripcion,
            ejerciciosIds: data.ejerciciosIds || data.ejercicios || [], // Compatibilidad
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : data.fechaCreacion,
            fechaModificacion: data.fechaModificacion instanceof Timestamp ? data.fechaModificacion.toDate() : data.fechaModificacion,
            duracion: data.duracion,
            creadorId: data.creadorId
        };
    }

    private mapToFirestore(rutina: Rutina): any {
        const data: any = {
            nombre: rutina.nombre,
            activa: rutina.activa ?? true
        };

        if (rutina.descripcion) data.descripcion = rutina.descripcion;
        if (rutina.ejerciciosIds && rutina.ejerciciosIds.length > 0) data.ejerciciosIds = rutina.ejerciciosIds;
        if (rutina.fechaCreacion) data.fechaCreacion = rutina.fechaCreacion instanceof Date ? Timestamp.fromDate(rutina.fechaCreacion) : rutina.fechaCreacion;
        if (rutina.fechaModificacion) data.fechaModificacion = rutina.fechaModificacion instanceof Date ? Timestamp.fromDate(rutina.fechaModificacion) : rutina.fechaModificacion;
        if (rutina.duracion && rutina.duracion > 0) data.duracion = rutina.duracion;
        if (rutina.creadorId) data.creadorId = rutina.creadorId;

        return data;
    }
}
