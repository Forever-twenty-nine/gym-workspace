import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector } from '@angular/core';
import { EntrenadoService } from './entrenado.service';
import { EntrenadorService, PlanLimitError } from './entrenador.service';
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
    private injector = inject(Injector);

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IInvitacionFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        // No inicializar listener aquí, se hará lazy cuando se acceda por primera vez
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
     * ✅ Aceptar invitación y vincular entrenado <-> entrenador
     */
    async aceptarInvitacion(invitacionId: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }

        try {
            // Intentar obtener de la lista general primero
            let invitacion: Invitacion | null = this._invitaciones().find(inv => inv.id === invitacionId) || null;
            
            // Si no está en la lista general, usar el signal específico
            if (!invitacion) {
                const invitacionSignal = this.getInvitacion(invitacionId);
                invitacion = invitacionSignal();
                
                // Si aún no está cargado, esperar un poco
                if (!invitacion) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    invitacion = invitacionSignal();
                }
            }

            if (!invitacion) {
                throw new Error(`Invitación ${invitacionId} no encontrada`);
            }

            const entrenadoId = invitacion.entrenadoId;
            const entrenadorId = invitacion.entrenadorId;

            // 1) Marcar invitación como aceptada
            await this.firestoreAdapter.updateEstado(invitacionId, 'aceptada');

            // 2) Actualizar entrenado: agregar entrenadorId a entrenadoresId
            const entrenadoService = this.injector.get(EntrenadoService);
            const entrenadoSignal = entrenadoService.getEntrenadoById(entrenadoId)();
            const entrenado = entrenadoSignal || entrenadoService.entrenados().find((e: any) => e.id === entrenadoId) || null;
            if (entrenado) {
                const entrenadoresId = [...(entrenado.entrenadoresId || [])];
                if (!entrenadoresId.includes(entrenadorId)) {
                    entrenadoresId.push(entrenadorId);
                    const entrenadoActualizado = { ...entrenado, entrenadoresId } as any;
                    await entrenadoService.save(entrenadoActualizado);
                }
            }

            // 3) Actualizar entrenador: agregar entrenadoId a entrenadosAsignadosIds
            const entrenadorService = this.injector.get(EntrenadorService);
            const entrenador = entrenadorService.getEntrenadorById(entrenadorId)();
            if (entrenador) {
                const entrenadosAsignadosIds = [...(entrenador.entrenadosAsignadosIds || [])];
                if (!entrenadosAsignadosIds.includes(entrenadoId)) {
                    // Check limit before adding
                    const limits = entrenadorService.getLimits(entrenadorId);
                    if (entrenadosAsignadosIds.length >= limits.maxClients) {
                        throw new PlanLimitError('Has alcanzado el límite de clientes para tu plan. Actualiza para conectar más.');
                    }
                    entrenadosAsignadosIds.push(entrenadoId);
                    await entrenadorService.update(entrenadorId, { entrenadosAsignadosIds });
                }
            }
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