import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    setDoc,
    query,
    orderBy,
    Timestamp,
    DocumentSnapshot
} from '@angular/fire/firestore';
import { EntrenadoService } from './entrenado.service';
import { EntrenadorService, PlanLimitError } from './entrenador.service';
import { Invitacion, Notificacion, TipoNotificacion } from 'gym-library';
import { NotificacionService } from './notificacion.service';
import { ZoneRunnerService } from './zone-runner.service';

@Injectable({ providedIn: 'root' })
export class InvitacionService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION_NAME = 'invitaciones';

    private readonly _invitaciones: WritableSignal<Invitacion[]> = signal<Invitacion[]>([]);
    private readonly invitacionSignals = new Map<string, WritableSignal<Invitacion | null>>();
    private isListenerInitialized = false;

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
            const invitacionesCol = collection(this.firestore, this.COLLECTION_NAME);
            const invitacionesQuery = query(invitacionesCol, orderBy('fechaCreacion', 'desc'));

            onSnapshot(invitacionesQuery, (snapshot) => {
                this.runInZone(() => {
                    const invitaciones: Invitacion[] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            id: doc.id,
                            fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                                ? data['fechaCreacion'].toDate()
                                : new Date(data['fechaCreacion']),
                            fechaRespuesta: data['fechaRespuesta'] instanceof Timestamp
                                ? data['fechaRespuesta'].toDate()
                                : data['fechaRespuesta'] ? new Date(data['fechaRespuesta']) : undefined
                        } as Invitacion;
                    });
                    this._invitaciones.set(invitaciones);
                });
            }, (error) => {
                console.error('❌ InvitacionService: Error en listener:', error);
                this._invitaciones.set([]);
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
        if (!this.isListenerInitialized) {
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

            const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
            onSnapshot(invitacionDoc, (snapshot: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        invitacionSignal.set({
                            ...data,
                            id: snapshot.id,
                            fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                                ? data['fechaCreacion'].toDate()
                                : new Date(data['fechaCreacion']),
                            fechaRespuesta: data['fechaRespuesta'] instanceof Timestamp
                                ? data['fechaRespuesta'].toDate()
                                : data['fechaRespuesta'] ? new Date(data['fechaRespuesta']) : undefined
                        } as Invitacion);
                    } else {
                        invitacionSignal.set(null);
                    }
                });
            }, (error) => {
                console.error('❌ InvitacionService: Error al suscribirse:', error);
                invitacionSignal.set(null);
            });
        }
        return this.invitacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una invitación
     */
    async save(invitacion: Invitacion): Promise<void> {
        try {
            await this.runInZone(async () => {
                const invitacionData = {
                    ...invitacion,
                    fechaCreacion: invitacion.fechaCreacion instanceof Date
                        ? Timestamp.fromDate(invitacion.fechaCreacion)
                        : Timestamp.now(),
                    fechaRespuesta: invitacion.fechaRespuesta instanceof Date
                        ? Timestamp.fromDate(invitacion.fechaRespuesta)
                        : null
                };

                if (invitacion.id) {
                    const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, invitacion.id);
                    await setDoc(invitacionDoc, invitacionData, { merge: true });
                } else {
                    const invitacionesCol = collection(this.firestore, this.COLLECTION_NAME);
                    await addDoc(invitacionesCol, invitacionData);
                }
            });
        } catch (error) {
            console.error('Error al guardar invitación:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una invitación por ID
     */
    async delete(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
                await deleteDoc(invitacionDoc);
            });
        } catch (error) {
            console.error('Error al eliminar invitación:', error);
            throw error;
        }
    }

    /**
     * 🔄 Actualiza el estado de una invitación
     */
    async updateEstado(id: string, estado: 'pendiente' | 'aceptada' | 'rechazada'): Promise<void> {
        return this.runInZone(async () => {
            try {
                const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
                const updateData: any = {
                    estado: estado,
                    fechaRespuesta: Timestamp.now()
                };

                if (estado === 'aceptada' || estado === 'rechazada') {
                    updateData.activa = false;
                }

                await updateDoc(invitacionDoc, updateData);
            } catch (error) {
                console.error('❌ InvitacionService: Error al actualizar estado:', error);
                throw error;
            }
        });
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

        // 1) Guardar invitación
        await this.save(invitacion);

        // 2) Crear notificación ligada a la invitación para el entrenado
        try {
            const notificacionService = this.injector.get(NotificacionService);
            const notificacion: Notificacion = {
                id: `notif-${invitacion.id}`,
                usuarioId: invitacion.entrenadoId, // La ve el entrenado
                tipo: TipoNotificacion.INVITACION_PENDIENTE,
                titulo: `Invitación de ${entrenadorNombre}`,
                mensaje: mensajePersonalizado || `${entrenadorNombre} te ha invitado a vincularse como tu entrenador`,
                leida: false,
                datos: {
                    invitacionId: invitacion.id,
                    entrenadorId,
                    entrenadorNombre,
                    emailInvitado: emailEntrenado,
                    estadoInvitacion: 'pendiente'
                },
                fechaCreacion: new Date()
            };

            await notificacionService.save(notificacion);
        } catch (e) {
            console.warn('No se pudo crear la notificación de invitación:', e);
        }
    }

    /**
     * ✅ Aceptar invitación y vincular entrenado <-> entrenador
     */
    async aceptarInvitacion(invitacionId: string): Promise<void> {
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
            await this.updateEstado(invitacionId, 'aceptada');

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

            // 4) Actualizar la notificación asociada a la invitación
            try {
                const notificacionService = this.injector.get(NotificacionService);
                await notificacionService.save({
                    id: `notif-${invitacionId}`,
                    usuarioId: entrenadoId,
                    tipo: TipoNotificacion.INVITACION_ACEPTADA,
                    titulo: 'Invitación aceptada',
                    mensaje: 'Has aceptado la invitación del entrenador',
                    leida: true, // Marcar como leída porque el usuario ejecutó la acción
                    fechaLeida: new Date(),
                    datos: {
                        invitacionId: invitacionId,
                        entrenadorId,
                        estadoInvitacion: 'aceptada',
                        fechaRespuesta: new Date()
                    },
                    fechaCreacion: new Date()
                } as Notificacion);

                // 5) Crear notificación para el entrenador informando aceptación
                await notificacionService.save({
                    id: `notif-${invitacionId}-entrenador`,
                    usuarioId: entrenadorId,
                    tipo: TipoNotificacion.INVITACION_ACEPTADA,
                    titulo: 'Tu invitación fue aceptada',
                    mensaje: `${invitacion.entrenadoNombre} aceptó tu invitación`,
                    leida: false,
                    datos: {
                        invitacionId: invitacionId,
                        entrenadorId,
                        remitenteId: entrenadoId,
                        remitenteNombre: invitacion.entrenadoNombre,
                        estadoInvitacion: 'aceptada',
                        fechaRespuesta: new Date()
                    },
                    fechaCreacion: new Date()
                } as Notificacion);
            } catch (e) {
                console.warn('No se pudo actualizar la notificación de invitación (aceptada):', e);
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
        try {
            await this.updateEstado(invitacionId, 'rechazada');

            // Actualizar notificación asociada a la invitación
            try {
                // Intentar obtener la invitación para conocer ids
                let invitacion: Invitacion | null = this._invitaciones().find(inv => inv.id === invitacionId) || null;
                if (!invitacion) {
                    const invSignal = this.getInvitacion(invitacionId);
                    invitacion = invSignal();
                }
                if (!invitacion) {
                    return;
                }

                const notificacionService = this.injector.get(NotificacionService);
                await notificacionService.save({
                    id: `notif-${invitacionId}`,
                    usuarioId: invitacion.entrenadoId,
                    tipo: TipoNotificacion.INVITACION_RECHAZADA,
                    titulo: 'Invitación rechazada',
                    mensaje: 'Has rechazado la invitación del entrenador',
                    leida: true, // Marcar como leída porque el usuario ejecutó la acción
                    fechaLeida: new Date(),
                    datos: {
                        invitacionId: invitacionId,
                        entrenadorId: invitacion.entrenadorId,
                        estadoInvitacion: 'rechazada',
                        fechaRespuesta: new Date()
                    },
                    fechaCreacion: new Date()
                } as Notificacion);

                // Crear notificación para el entrenador informando rechazo
                await notificacionService.save({
                    id: `notif-${invitacionId}-entrenador`,
                    usuarioId: invitacion.entrenadorId,
                    tipo: TipoNotificacion.INVITACION_RECHAZADA,
                    titulo: 'Tu invitación fue rechazada',
                    mensaje: `${invitacion.entrenadoNombre} rechazó tu invitación`,
                    leida: false,
                    datos: {
                        invitacionId: invitacionId,
                        entrenadorId: invitacion.entrenadorId,
                        remitenteId: invitacion.entrenadoId,
                        remitenteNombre: invitacion.entrenadoNombre,
                        estadoInvitacion: 'rechazada',
                        fechaRespuesta: new Date()
                    },
                    fechaCreacion: new Date()
                } as Notificacion);
            } catch (e) {
                console.warn('No se pudo actualizar la notificación de invitación (rechazada):', e);
            }
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
