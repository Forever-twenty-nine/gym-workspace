import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Invitacion } from '../models/invitacion.model';

export interface IInvitacionFirestoreAdapter {
  initializeListener(onUpdate: (invitaciones: Invitacion[]) => void): void;
  subscribeToInvitacion(id: string, onUpdate: (invitacion: Invitacion | null) => void): void;
  save(invitacion: Invitacion): Promise<void>;
  delete(id: string): Promise<void>;
  aceptar(id: string): Promise<void>;
  rechazar(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class InvitacionService {
    private readonly _invitaciones: WritableSignal<Invitacion[]> = signal<Invitacion[]>([]);
    private readonly invitacionSignals = new Map<string, WritableSignal<Invitacion | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IInvitacionFirestoreAdapter;

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IInvitacionFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((invitaciones: Invitacion[]) => {
                this._invitaciones.set(invitaciones);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de invitaciones:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de invitaciones
     */
    get invitaciones(): Signal<Invitacion[]> {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.initializeListener();
        }
        return this._invitaciones.asReadonly();
    }

    /**
     * 📊 Obtiene una invitación específica por ID
     */
    getInvitacion(id: string): Signal<Invitacion | null> {
        if (!this.invitacionSignals.has(id)) {
            const invitacionSignal = signal<Invitacion | null>(null);
            this.invitacionSignals.set(id, invitacionSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToInvitacion(id, (invitacion) => {
                    invitacionSignal.set(invitacion);
                });
            }
        }
        return this.invitacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una invitación
     */
    async save(invitacion: Invitacion): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(invitacion);
        } catch (error) {
            console.error('Error al guardar invitación:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una invitación por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
        } catch (error) {
            console.error('Error al eliminar invitación:', error);
            throw error;
        }
    }

    /**
     * ✅ Acepta una invitación
     */
    async aceptar(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.aceptar(id);
        } catch (error) {
            console.error('Error al aceptar invitación:', error);
            throw error;
        }
    }

    /**
     * ❌ Rechaza una invitación
     */
    async rechazar(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.rechazar(id);
        } catch (error) {
            console.error('Error al rechazar invitación:', error);
            throw error;
        }
    }

    /**
     * 🔍 Obtiene invitaciones por entrenador
     */
    getInvitacionesByEntrenador(entrenadorId: string): Signal<Invitacion[]> {
        return computed(() => 
            this._invitaciones().filter(inv => inv.entrenadorId === entrenadorId)
        );
    }

    /**
     * 🔍 Obtiene invitaciones por entrenado
     */
    getInvitacionesByEntrenado(entrenadoId: string): Signal<Invitacion[]> {
        return computed(() => 
            this._invitaciones().filter(inv => inv.entrenadoId === entrenadoId)
        );
    }

    /**
     * 🔍 Obtiene invitaciones por email
     */
    getInvitacionesByEmail(email: string): Signal<Invitacion[]> {
        return computed(() => 
            this._invitaciones().filter(inv => inv.email === email)
        );
    }

    /**
     * 📊 Obtiene invitaciones pendientes
     */
    getInvitacionesPendientes(entrenadorId?: string): Signal<Invitacion[]> {
        return computed(() => 
            this._invitaciones().filter(inv => 
                inv.estado === 'pendiente' && 
                (!entrenadorId || inv.entrenadorId === entrenadorId)
            )
        );
    }

    /**
     * 📊 Obtiene invitaciones por estado
     */
    getInvitacionesByEstado(estado: 'pendiente' | 'aceptada' | 'rechazada'): Signal<Invitacion[]> {
        return computed(() => 
            this._invitaciones().filter(inv => inv.estado === estado)
        );
    }

    /**
     * 📊 Contador de invitaciones pendientes
     */
    getContadorPendientes(entrenadorId?: string): Signal<number> {
        return computed(() => 
            this._invitaciones().filter(inv => 
                inv.estado === 'pendiente' && 
                (!entrenadorId || inv.entrenadorId === entrenadorId)
            ).length
        );
    }

    /**
     * 📊 Obtiene el conteo total de invitaciones
     */
    get invitacionCount(): Signal<number> {
        return computed(() => this._invitaciones().length);
    }
}
