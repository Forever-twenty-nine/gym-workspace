import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Invitacion } from '../models/invitacion.model';

export interface IInvitacionFirestoreAdapter {
  initializeListener(onUpdate: (invitaciones: Invitacion[]) => void): void;
  subscribeToInvitacion(id: string, onUpdate: (invitacion: Invitacion | null) => void): void;
  save(invitacion: Invitacion): Promise<void>;
  delete(id: string): Promise<void>;
  updateEstado(id: string, estado: 'pendiente' | 'aceptada' | 'rechazada'): Promise<void>;
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
     * 📨 Crear invitación de entrenador a entrenado
     */
    async crearInvitacion(
        entrenadorId: string,
        entrenadoId: string,
        entrenadorNombre: string,
        entrenadoNombre: string,
        emailEntrenado: string,
        mensajePersonalizado?: string
    ): Promise<void> {
        const invitacion: Invitacion = {
            id: `inv-${entrenadorId}-${entrenadoId}-${Date.now()}`,
            entrenadorId,
            entrenadoId,
            entrenadorNombre,
            entrenadoNombre,
            emailEntrenado,
            estado: 'pendiente',
            mensajePersonalizado,
            fechaCreacion: new Date(),
            activa: true
        };

        await this.save(invitacion);
    }

    /**
     * ✅ Aceptar invitación
     */
    async aceptarInvitacion(invitacionId: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }

        try {
            await this.firestoreAdapter.updateEstado(invitacionId, 'aceptada');
        } catch (error) {
            console.error('Error al aceptar invitación:', error);
            throw error;
        }
    }

    /**
     * ❌ Rechazar invitación
     */
    async rechazarInvitacion(invitacionId: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }

        try {
            await this.firestoreAdapter.updateEstado(invitacionId, 'rechazada');
        } catch (error) {
            console.error('Error al rechazar invitación:', error);
            throw error;
        }
    }

    /**
     * 📋 Obtener invitaciones por entrenador
     */
    getInvitacionesPorEntrenador(entrenadorId: string): Signal<Invitacion[]> {
        return computed(() =>
            this._invitaciones().filter(inv =>
                inv.entrenadorId === entrenadorId
            )
        );
    }

    /**
     * 📋 Obtener invitaciones por entrenado
     */
    getInvitacionesPorEntrenado(entrenadoId: string): Signal<Invitacion[]> {
        return computed(() =>
            this._invitaciones().filter(inv =>
                inv.entrenadoId === entrenadoId
            )
        );
    }

    /**
     * 📋 Obtener invitaciones pendientes por entrenador
     */
    getInvitacionesPendientesPorEntrenador(entrenadorId: string): Signal<Invitacion[]> {
        return computed(() =>
            this._invitaciones().filter(inv =>
                inv.entrenadorId === entrenadorId &&
                inv.estado === 'pendiente' &&
                inv.activa
            )
        );
    }

    /**
     * 📋 Obtener invitaciones pendientes por entrenado
     */
    getInvitacionesPendientesPorEntrenado(entrenadoId: string): Signal<Invitacion[]> {
        return computed(() =>
            this._invitaciones().filter(inv =>
                inv.entrenadoId === entrenadoId &&
                inv.estado === 'pendiente' &&
                inv.activa
            )
        );
    }
}