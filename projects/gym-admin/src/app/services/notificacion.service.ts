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
    getDocs,
    Timestamp,
    DocumentSnapshot
} from 'firebase/firestore';
import { Notificacion } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
    private readonly firestore = inject(FIRESTORE);

    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION_NAME = 'notificaciones';

    private readonly _notificaciones: WritableSignal<Notificacion[]> = signal<Notificacion[]>([]);
    private readonly notificacionSignals = new Map<string, WritableSignal<Notificacion | null>>();
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
            const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
            const notificacionesQuery = query(notificacionesCol, orderBy('fechaCreacion', 'desc'));

            onSnapshot(notificacionesQuery, (snapshot) => {
                this.runInZone(() => {
                    const notificaciones: Notificacion[] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            id: doc.id,
                            fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                                ? data['fechaCreacion'].toDate()
                                : new Date(data['fechaCreacion']),
                            fechaLeida: data['fechaLeida'] instanceof Timestamp
                                ? data['fechaLeida'].toDate()
                                : data['fechaLeida'] ? new Date(data['fechaLeida']) : undefined
                        } as Notificacion;
                    });
                    this._notificaciones.set(notificaciones);
                });
            }, (error) => {
                console.error('❌ NotificacionService: Error en listener:', error);
                this._notificaciones.set([]);
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
        if (!this.isListenerInitialized) {
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

            const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
            onSnapshot(notificacionDoc, (snapshot: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        notificacionSignal.set({
                            ...data,
                            id: snapshot.id,
                            fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                                ? data['fechaCreacion'].toDate()
                                : new Date(data['fechaCreacion']),
                            fechaLeida: data['fechaLeida'] instanceof Timestamp
                                ? data['fechaLeida'].toDate()
                                : data['fechaLeida'] ? new Date(data['fechaLeida']) : undefined
                        } as Notificacion);
                    } else {
                        notificacionSignal.set(null);
                    }
                });
            }, (error) => {
                console.error('❌ NotificacionService: Error al suscribirse:', error);
                notificacionSignal.set(null);
            });
        }
        return this.notificacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una notificación
     */
    async save(notificacion: Notificacion): Promise<void> {
        try {
            await this.runInZone(async () => {
                const notificacionData = {
                    ...notificacion,
                    fechaCreacion: notificacion.fechaCreacion instanceof Date
                        ? Timestamp.fromDate(notificacion.fechaCreacion)
                        : Timestamp.now(),
                    fechaLeida: notificacion.fechaLeida instanceof Date
                        ? Timestamp.fromDate(notificacion.fechaLeida)
                        : null
                };

                if (notificacion.id) {
                    const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, notificacion.id);
                    await setDoc(notificacionDoc, notificacionData, { merge: true });
                } else {
                    const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
                    await addDoc(notificacionesCol, notificacionData);
                }
            });
        } catch (error) {
            console.error('Error al guardar notificación:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina una notificación por ID
     */
    async delete(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
                await deleteDoc(notificacionDoc);
            });
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca una notificación como leída
     */
    async marcarComoLeida(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
                await updateDoc(notificacionDoc, {
                    leida: true,
                    fechaLeida: Timestamp.now()
                });
            });
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca todas las notificaciones de un usuario como leídas
     */
    async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
                const querySnapshot = await getDocs(query(notificacionesCol));

                const updates = querySnapshot.docs
                    .filter(doc => doc.data()['usuarioId'] === usuarioId && !doc.data()['leida'])
                    .map(doc => updateDoc(doc.ref, {
                        leida: true,
                        fechaLeida: Timestamp.now()
                    }));

                await Promise.all(updates);
            });
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

