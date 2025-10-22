import { Injectable, signal, WritableSignal, Signal, computed, inject } from '@angular/core';
import { Rutina } from '../models/rutina.model';
import { EjercicioService } from './ejercicio.service';

export interface IRutinaFirestoreAdapter {
  initializeListener(onUpdate: (rutinas: Rutina[]) => void): void;
  subscribeToRutina(id: string, onUpdate: (rutina: Rutina | null) => void): void;
  save(rutina: Rutina): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface RutinaConEjercicios extends Rutina {
  ejercicios: any[]; // Ejercicios ya resueltos
}

@Injectable({ providedIn: 'root' })
export class RutinaService {
    // Señal interna con todas las rutinas
    private readonly _rutinas: WritableSignal<Rutina[]> = signal<Rutina[]>([]);
    private readonly rutinaSignals = new Map<string, WritableSignal<Rutina | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IRutinaFirestoreAdapter;
    
    // Inyectar EjercicioService para combinar datos
    private readonly ejercicioService = inject(EjercicioService);

    constructor() {
        // La inicialización se hará cuando se configure el adaptador
    }

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IRutinaFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((rutinas: Rutina[]) => {
                this._rutinas.set(rutinas);
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
        if (!this.isListenerInitialized && this.firestoreAdapter) {
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
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToRutina(id, (rutina) => {
                    rutinaSignal.set(rutina);
                });
            }
        }
        return this.rutinaSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una rutina (upsert si tiene id)
     */
    async save(rutina: Rutina): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(rutina);
        } catch (error) {
            console.error('Error al guardar rutina:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una rutina por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
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
     * 🔍 Busca rutinas por día de la semana
     */
    getRutinasByDiaSemana(dia: string): Signal<Rutina[]> {
        return computed(() => 
            this._rutinas().filter(rutina => 
                rutina.DiasSemana?.includes(dia) || false
            )
        );
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
            };
        });
    }
}