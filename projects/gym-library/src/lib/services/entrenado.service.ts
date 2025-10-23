import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Entrenado } from '../models/entrenado.model';

export interface IEntrenadoFirestoreAdapter {
  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void;
  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void;
  save(entrenado: Entrenado): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class EntrenadoService {
    // Señal que contiene la lista de entrenados (reactiva)
    private readonly _entrenados: WritableSignal<Entrenado[]> = signal<Entrenado[]>([]);
    private readonly entrenadoSignals = new Map<string, WritableSignal<Entrenado | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IEntrenadoFirestoreAdapter;

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IEntrenadoFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((entrenados: Entrenado[]) => {
                this._entrenados.set(entrenados);
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
        if (!this.isListenerInitialized && this.firestoreAdapter) {
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
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToEntrenado(id, (entrenado) => {
                    entrenadoSignal.set(entrenado);
                });
            }
        }
        return this.entrenadoSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un entrenado (upsert si tiene id)
     */
    async save(entrenado: Entrenado): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(entrenado);
            
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
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
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
        return computed(() => 
            this._entrenados().filter(entrenado => 
                entrenado.rutinasAsignadas?.includes(rutinaId)
            )
        );
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
     * 🏋️ Asigna una rutina a un entrenado
     */
    async asignarRutina(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenado = this._entrenados().find(e => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const rutinasAsignadas = entrenado.rutinasAsignadas || [];
        
        // Si ya está asignada, no hacer nada
        if (rutinasAsignadas.includes(rutinaId)) {
            return;
        }

        const entrenadoActualizado: Entrenado = {
            ...entrenado,
            rutinasAsignadas: [...rutinasAsignadas, rutinaId]
        };

        await this.save(entrenadoActualizado);
    }

    /**
     * 🏋️ Desasigna una rutina de un entrenado
     */
    async desasignarRutina(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenado = this._entrenados().find(e => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const rutinasAsignadas = entrenado.rutinasAsignadas || [];
        // Eliminar todas las instancias del rutinaId (por si hay duplicados)
        const nuevosAsignados = rutinasAsignadas.filter(id => id !== rutinaId);

        const entrenadoActualizado: Entrenado = {
            ...entrenado,
            rutinasAsignadas: nuevosAsignados.length > 0 ? nuevosAsignados : undefined
        };

        await this.save(entrenadoActualizado);
    }
}
