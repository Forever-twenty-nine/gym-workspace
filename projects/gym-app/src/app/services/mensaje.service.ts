import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Mensaje } from 'gym-library';

export interface IMensajeFirestoreAdapter {
  initializeListener(onUpdate: (mensajes: Mensaje[]) => void): void;
  subscribeToMensaje(id: string, onUpdate: (mensaje: Mensaje | null) => void): void;
  save(mensaje: Mensaje): Promise<void>;
  delete(id: string): Promise<void>;
  marcarComoLeido(id: string): Promise<void>;
  marcarComoEntregado(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class MensajeService {
    private readonly _mensajes: WritableSignal<Mensaje[]> = signal<Mensaje[]>([]);
    private readonly mensajeSignals = new Map<string, WritableSignal<Mensaje | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IMensajeFirestoreAdapter;

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IMensajeFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        // No inicializar listener aquí, se hará lazy cuando se acceda por primera vez
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((mensajes: Mensaje[]) => {
                this._mensajes.set(mensajes);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de mensajes:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de mensajes
     */
    get mensajes(): Signal<Mensaje[]> {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.initializeListener();
        }
        return this._mensajes.asReadonly();
    }

    /**
     * 📊 Obtiene un mensaje específico por ID
     */
    getMensaje(id: string): Signal<Mensaje | null> {
        if (!this.mensajeSignals.has(id)) {
            const mensajeSignal = signal<Mensaje | null>(null);
            this.mensajeSignals.set(id, mensajeSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToMensaje(id, (mensaje) => {
                    mensajeSignal.set(mensaje);
                });
            }
        }
        return this.mensajeSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un mensaje
     */
    async save(mensaje: Mensaje): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(mensaje);
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina un mensaje por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
        } catch (error) {
            console.error('Error al eliminar mensaje:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca un mensaje como leído
     */
    async marcarComoLeido(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.marcarComoLeido(id);
        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            throw error;
        }
    }

    /**
     * 📩 Marca un mensaje como entregado
     */
    async marcarComoEntregado(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.marcarComoEntregado(id);
        } catch (error) {
            console.error('Error al marcar mensaje como entregado:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtiene mensajes enviados por un usuario
     */
    getMensajesByRemitente(remitenteId: string): Signal<Mensaje[]> {
        return computed(() => 
            this._mensajes().filter(msg => msg.remitenteId === remitenteId)
        );
    }

    /**
     * 🔍 Obtiene mensajes recibidos por un usuario
     */
    getMensajesByDestinatario(destinatarioId: string): Signal<Mensaje[]> {
        return computed(() => 
            this._mensajes().filter(msg => msg.destinatarioId === destinatarioId)
        );
    }

    /**
     * 📊 Obtiene mensajes no leídos para un usuario
     */
    getMensajesNoLeidos(destinatarioId: string): Signal<Mensaje[]> {
        return computed(() => 
            this._mensajes().filter(msg => 
                msg.destinatarioId === destinatarioId && !msg.leido
            )
        );
    }

    /**
     * 📊 Contador de mensajes no leídos
     */
    getContadorNoLeidos(destinatarioId: string): Signal<number> {
        return computed(() => 
            this._mensajes().filter(msg => 
                msg.destinatarioId === destinatarioId && !msg.leido
            ).length
        );
    }

    /**
     * � Obtiene mensajes por entrenador (enviados o recibidos)
     */
    getMensajesByEntrenador(entrenadorId: string): Signal<Mensaje[]> {
        return computed(() => 
            this._mensajes().filter(msg => 
                msg.remitenteId === entrenadorId || msg.destinatarioId === entrenadorId
            )
        );
    }
}
