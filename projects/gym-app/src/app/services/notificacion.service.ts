import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Notificacion } from 'gym-library';
import { TipoNotificacion } from 'gym-library';

export interface INotificacionFirestoreAdapter {
  initializeListener(onUpdate: (notificaciones: Notificacion[]) => void): void;
  subscribeToNotificacion(id: string, onUpdate: (notificacion: Notificacion | null) => void): void;
  save(notificacion: Notificacion): Promise<void>;
  delete(id: string): Promise<void>;
  marcarComoLeida(id: string): Promise<void>;
  marcarTodasComoLeidas(usuarioId: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
    private readonly _notificaciones: WritableSignal<Notificacion[]> = signal<Notificacion[]>([]);
    private readonly notificacionSignals = new Map<string, WritableSignal<Notificacion | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: INotificacionFirestoreAdapter;

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: INotificacionFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        // No inicializar listener aquí, se hará lazy cuando se acceda por primera vez
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((notificaciones: Notificacion[]) => {
                
                this._notificaciones.set(notificaciones);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de notificaciones:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de notificaciones
     */
    get notificaciones(): Signal<Notificacion[]> {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.initializeListener();
        }
        return this._notificaciones.asReadonly();
    }

    /**
     * 📊 Obtiene una notificación específica por ID
     */
    getNotificacion(id: string): Signal<Notificacion | null> {
        if (!this.notificacionSignals.has(id)) {
            const notificacionSignal = signal<Notificacion | null>(null);
            this.notificacionSignals.set(id, notificacionSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToNotificacion(id, (notificacion) => {
                    notificacionSignal.set(notificacion);
                });
            }
        }
        return this.notificacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una notificación
     */
    async save(notificacion: Notificacion): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(notificacion);
        } catch (error) {
            console.error('Error al guardar notificación:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una notificación por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca una notificación como leída
     */
    async marcarComoLeida(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.marcarComoLeida(id);
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca todas las notificaciones de un usuario como leídas
     */
    async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.marcarTodasComoLeidas(usuarioId);
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtiene notificaciones por usuario
     */
    getNotificacionesByUsuario(usuarioId: string): Signal<Notificacion[]> {
        return computed(() => 
            this._notificaciones().filter(notif => notif.usuarioId === usuarioId)
        );
    }

    /**
     * 📊 Obtiene solo notificaciones no leídas
     */
    getNotificacionesNoLeidas(usuarioId: string): Signal<Notificacion[]> {
        return computed(() => 
            this._notificaciones().filter(notif => 
                notif.usuarioId === usuarioId && !notif.leida
            )
        );
    }

    /**
     * 📊 Contador de notificaciones no leídas
     */
    getContadorNoLeidas(usuarioId: string): Signal<number> {
        return computed(() => 
            this._notificaciones().filter(notif => 
                notif.usuarioId === usuarioId && !notif.leida
            ).length
        );
    }

    /**
     * 📋 Buscar notificaciones por tipo
     */
    getNotificacionesByTipo(usuarioId: string, tipo: string): Signal<Notificacion[]> {
        return computed(() => 
            this._notificaciones().filter(notif => 
                notif.usuarioId === usuarioId && notif.tipo === tipo
            )
        );
    }
}
