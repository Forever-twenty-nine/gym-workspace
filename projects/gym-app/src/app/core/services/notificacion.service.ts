import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    onSnapshot,
    QuerySnapshot,
    DocumentSnapshot,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    getDocs
} from 'firebase/firestore';
import { Notificacion, TipoNotificacion, ConfigNotificacion } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly platform = inject(Platform);
    private readonly COLLECTION = 'notificaciones';

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
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, orderBy('fechaCreacion', 'desc'));
            onSnapshot(q, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._notificaciones.set(list);
                });
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

            const notificacionRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(notificacionRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        notificacionSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        notificacionSignal.set(null);
                    }
                });
            });
        }
        return this.notificacionSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza una notificación
     */
    async save(notificacion: Notificacion): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(notificacion);
            if (notificacion.id) {
                const notificacionRef = doc(this.firestore, this.COLLECTION, notificacion.id);
                await setDoc(notificacionRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                await addDoc(col, dataToSave);
            }
        });
    }

    /**
     * 🗑️ Elimina una notificación por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const notificacionRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(notificacionRef);
        });
    }

    /**
     * ✅ Marca una notificación como leída
     */
    async marcarComoLeida(id: string): Promise<void> {
        return this.runInZone(async () => {
            const notificacionRef = doc(this.firestore, this.COLLECTION, id);
            await updateDoc(notificacionRef, {
                leida: true,
                fechaLeida: Timestamp.now()
            });
        });
    }

    /**
     * ✅ Marca todas las notificaciones de un usuario como leídas
     */
    async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
        return this.runInZone(async () => {
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, where('usuarioId', '==', usuarioId), where('leida', '==', false));
            const snap = await getDocs(q);
            const updates = snap.docs.map(d => updateDoc(d.ref, {
                leida: true,
                fechaLeida: Timestamp.now()
            }));
            await Promise.all(updates);
        });
    }

    /**
     * 🔍 Obtiene notificaciones por usuario
     */
    getNotificacionesByUsuario(usuarioId: string): Signal<Notificacion[]> {
        return computed(() =>
            this.notificaciones().filter(notif => notif.usuarioId === usuarioId)
        );
    }

    /**
     * 📊 Obtiene solo notificaciones no leídas
     */
    getNotificacionesNoLeidas(usuarioId: string): Signal<Notificacion[]> {
        return computed(() =>
            this.notificaciones().filter(notif =>
                notif.usuarioId === usuarioId && !notif.leida
            )
        );
    }

    /**
     * 📊 Contador de notificaciones no leídas
     */
    getContadorNoLeidas(usuarioId: string): Signal<number> {
        return computed(() =>
            this.notificaciones().filter(notif =>
                notif.usuarioId === usuarioId && !notif.leida
            ).length
        );
    }

    /**
     * 📋 Buscar notificaciones por tipo
     */
    getNotificacionesByTipo(usuarioId: string, tipo: string): Signal<Notificacion[]> {
        return computed(() =>
            this.notificaciones().filter(notif =>
                notif.usuarioId === usuarioId && notif.tipo === tipo
            )
        );
    }

    /**
     * 📅 Programa recordatorios de entrenamiento locales
     */
    async programarRecordatoriosEntrenamiento(config?: ConfigNotificacion): Promise<void> {
        if (!this.platform.is('capacitor')) return;

        try {
            // Primero cancelamos todos los recordatorios existentes
            await this.cancelarRecordatorios();

            if (!config || !config.recordatoriosEntrenamiento || !config.horaRecordatorio || !config.diasRecordatorio?.length) {
                return;
            }

            const [hours, minutes] = config.horaRecordatorio.split(':').map(Number);

            const notifications = config.diasRecordatorio.map(dia => ({
                title: '¡Hora de entrenar!',
                body: 'Tienes una rutina esperándote. ¡No faltes!',
                id: 100 + dia, // IDs únicos por día de la semana
                schedule: {
                    on: {
                        weekday: dia + 1, // Capacitor usa 1 (Dom) a 7 (Sab), nosotros 0-6
                        hour: hours,
                        minute: minutes
                    },
                    repeats: true,
                    allowWhileIdle: true
                }
            }));

            await LocalNotifications.schedule({ notifications });
            console.log('✅ Recordatorios programados:', notifications);
        } catch (e) {
            console.error('❌ Error programando recordatorios:', e);
        }
    }

    /**
     * 🚫 Cancela todos los recordatorios locales de entrenamiento
     */
    async cancelarRecordatorios(): Promise<void> {
        if (!this.platform.is('capacitor')) return;

        try {
            const pending = await LocalNotifications.getPending();
            const idsToCancel = pending.notifications
                .filter(n => n.id >= 100 && n.id <= 107)
                .map(n => ({ id: n.id }));

            if (idsToCancel.length > 0) {
                await LocalNotifications.cancel({ notifications: idsToCancel });
            }
        } catch (e) {
            console.error('❌ Error cancelando recordatorios:', e);
        }
    }

    private mapFromFirestore(data: any): Notificacion {
        return {
            ...data,
            id: data.id,
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
            fechaLeida: data.fechaLeida instanceof Timestamp ? data.fechaLeida.toDate() : (data.fechaLeida ? new Date(data.fechaLeida) : undefined)
        } as Notificacion;
    }

    private mapToFirestore(notificacion: Notificacion): any {
        const data: any = {
            usuarioId: notificacion.usuarioId,
            tipo: notificacion.tipo,
            titulo: notificacion.titulo,
            mensaje: notificacion.mensaje,
            leida: notificacion.leida || false,
            fechaCreacion: notificacion.fechaCreacion instanceof Date ? Timestamp.fromDate(notificacion.fechaCreacion) : (notificacion.fechaCreacion || Timestamp.now())
        };

        if (notificacion.fechaLeida) {
            data.fechaLeida = notificacion.fechaLeida instanceof Date ? Timestamp.fromDate(notificacion.fechaLeida) : notificacion.fechaLeida;
        }

        if (notificacion.datos) {
            data.datos = notificacion.datos;
        }

        return data;
    }
}

