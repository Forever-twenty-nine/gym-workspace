import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Conversacion } from '../models/conversacion.model';

export interface IConversacionFirestoreAdapter {
  initializeListener(onUpdate: (conversaciones: Conversacion[]) => void): void;
  subscribeToConversacion(id: string, onUpdate: (conversacion: Conversacion | null) => void): void;
  save(conversacion: Conversacion): Promise<void>;
  delete(id: string): Promise<void>;
  actualizarUltimoMensaje(id: string, mensaje: string, fecha: Date): Promise<void>;
  incrementarNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void>;
  resetearNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class ConversacionService {
    private readonly _conversaciones: WritableSignal<Conversacion[]> = signal<Conversacion[]>([]);
    private readonly conversacionSignals = new Map<string, WritableSignal<Conversacion | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IConversacionFirestoreAdapter;

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IConversacionFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((conversaciones: Conversacion[]) => {
                this._conversaciones.set(conversaciones);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de conversaciones:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de conversaciones
     */
    get conversaciones(): Signal<Conversacion[]> {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.initializeListener();
        }
        return this._conversaciones.asReadonly();
    }

    /**
     * 📊 Obtiene una conversación específica por ID
     */
    getConversacion(id: string): Signal<Conversacion | null> {
        if (!this.conversacionSignals.has(id)) {
            const conversacionSignal = signal<Conversacion | null>(null);
            this.conversacionSignals.set(id, conversacionSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToConversacion(id, (conversacion) => {
                    conversacionSignal.set(conversacion);
                });
            }
        }
        return this.conversacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una conversación
     */
    async save(conversacion: Conversacion): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(conversacion);
        } catch (error) {
            console.error('Error al guardar conversación:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una conversación por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
            throw error;
        }
    }

    /**
     * 📝 Actualiza el último mensaje de una conversación
     */
    async actualizarUltimoMensaje(id: string, mensaje: string, fecha: Date): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.actualizarUltimoMensaje(id, mensaje, fecha);
        } catch (error) {
            console.error('Error al actualizar último mensaje:', error);
            throw error;
        }
    }

    /**
     * ➕ Incrementa el contador de no leídos
     */
    async incrementarNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.incrementarNoLeidos(id, tipo);
        } catch (error) {
            console.error('Error al incrementar no leídos:', error);
            throw error;
        }
    }

    /**
     * 🔄 Resetea el contador de no leídos
     */
    async resetearNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.resetearNoLeidos(id, tipo);
        } catch (error) {
            console.error('Error al resetear no leídos:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtiene conversaciones de un entrenador
     */
    getConversacionesByEntrenador(entrenadorId: string): Signal<Conversacion[]> {
        return computed(() => 
            this._conversaciones()
                .filter(conv => conv.entrenadorId === entrenadorId && conv.activa)
                .sort((a, b) => 
                    (b.fechaUltimaActividad?.getTime() || 0) - (a.fechaUltimaActividad?.getTime() || 0)
                )
        );
    }

    /**
     * 🔍 Obtiene conversaciones de un entrenado
     */
    getConversacionesByEntrenado(entrenadoId: string): Signal<Conversacion[]> {
        return computed(() => 
            this._conversaciones()
                .filter(conv => conv.entrenadoId === entrenadoId && conv.activa)
                .sort((a, b) => 
                    (b.fechaUltimaActividad?.getTime() || 0) - (a.fechaUltimaActividad?.getTime() || 0)
                )
        );
    }

    /**
     * 🔍 Obtiene conversaciones de un gimnasio
     */
    getConversacionesByGimnasio(gimnasioId: string): Signal<Conversacion[]> {
        return computed(() => 
            this._conversaciones().filter(conv => 
                conv.gimnasioId === gimnasioId && conv.activa
            )
        );
    }

    /**
     * 📊 Contador total de no leídos para un entrenador
     */
    getTotalNoLeidosEntrenador(entrenadorId: string): Signal<number> {
        return computed(() => 
            this._conversaciones()
                .filter(conv => conv.entrenadorId === entrenadorId)
                .reduce((sum, conv) => sum + conv.noLeidosEntrenador, 0)
        );
    }

    /**
     * 📊 Contador total de no leídos para un entrenado
     */
    getTotalNoLeidosEntrenado(entrenadoId: string): Signal<number> {
        return computed(() => 
            this._conversaciones()
                .filter(conv => conv.entrenadoId === entrenadoId)
                .reduce((sum, conv) => sum + conv.noLeidosEntrenado, 0)
        );
    }

    /**
     * 🔍 Busca conversación entre entrenador y entrenado
     */
    getConversacionEntreUsuarios(entrenadorId: string, entrenadoId: string): Signal<Conversacion | null> {
        return computed(() => 
            this._conversaciones().find(conv => 
                conv.entrenadorId === entrenadorId && 
                conv.entrenadoId === entrenadoId
            ) || null
        );
    }

    /**
     * 📊 Obtiene el conteo total de conversaciones
     */
    get conversacionCount(): Signal<number> {
        return computed(() => this._conversaciones().length);
    }

    /**
     * 📊 Obtiene el conteo de conversaciones activas
     */
    get conversacionActivaCount(): Signal<number> {
        return computed(() => this._conversaciones().filter(c => c.activa).length);
    }
}
