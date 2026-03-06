import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore, // Keep Firestore type for type annotation
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    updateDoc, // Added updateDoc
    onSnapshot,
    Timestamp,
    QuerySnapshot,
    DocumentSnapshot
} from 'firebase/firestore'; // Changed import path
import { Rutina } from 'gym-library';
import { EjercicioService } from './ejercicio.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens'; // Added new import

export interface RutinaConEjercicios extends Rutina {
    ejercicios: any[]; // Ejercicios ya resueltos
}

@Injectable({ providedIn: 'root' })
export class RutinaService {
    private readonly firestore = inject(FIRESTORE); // Changed injection token
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
            onSnapshot(rutinaRef, (snapshot: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (snapshot.exists()) {
                        rutinaSignal.set(this.mapFromFirestore({ ...snapshot.data(), id: snapshot.id }));
                    } else {
                        rutinaSignal.set(null);
                    }
                });
            });
        }
        return this.rutinaSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una rutina (upsert si tiene id)
     */
    async save(rutina: Rutina): Promise<void> {
        try {
            await this.runInZone(async () => {
                const dataToSave = this.mapToFirestore(rutina);

                if (rutina.id) {
                    const rutinaRef = doc(this.firestore, this.COLLECTION, rutina.id);
                    await setDoc(rutinaRef, dataToSave, { merge: true });
                } else {
                    await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
                }
            });
        } catch (error) {
            console.error('Error al guardar rutina:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una rutina por ID
     */
    async delete(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const rutinaRef = doc(this.firestore, this.COLLECTION, id);
                await deleteDoc(rutinaRef);
            });
        } catch (error) {
            console.error('Error al eliminar rutina:', error);
            throw error;
        }
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
            descripcion: data.descripcion || '',
            ejerciciosIds: data.ejerciciosIds || data.ejercicios || [], // Compatibilidad con ambos formatos
            fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
            fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion,
            duracion: data.duracion,
            creadorId: data.creadorId, // IMPORTANTE: Mapear el autor
            compartida: data.compartida,
            usuarioId: data.usuarioId,
            nombreUsuario: data.nombreUsuario
        };
    }

    private mapToFirestore(rutina: Rutina): any {
        const data: any = {
            nombre: rutina.nombre,
            activa: rutina.activa,
            descripcion: rutina.descripcion || '',
            ejerciciosIds: rutina.ejerciciosIds || []
        };

        if (rutina.duracion && rutina.duracion > 0) {
            data.duracion = rutina.duracion;
        }

        if (rutina.fechaCreacion) {
            data.fechaCreacion = rutina.fechaCreacion instanceof Date
                ? Timestamp.fromDate(rutina.fechaCreacion)
                : rutina.fechaCreacion;
        }

        if (rutina.fechaModificacion) {
            data.fechaModificacion = rutina.fechaModificacion instanceof Date
                ? Timestamp.fromDate(rutina.fechaModificacion)
                : rutina.fechaModificacion;
        }

        if (rutina.creadorId) {
            data.creadorId = rutina.creadorId;
        }
        return data;
    }
}
