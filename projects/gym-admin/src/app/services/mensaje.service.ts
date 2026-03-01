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
} from 'firebase/firestore';
import { Mensaje } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from './firebase.tokens';

@Injectable({ providedIn: 'root' })
export class MensajeService {
    private readonly firestore = inject(FIRESTORE);

    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'mensajes';

    private readonly _mensajes: WritableSignal<Mensaje[]> = signal<Mensaje[]>([]);
    private readonly mensajeSignals = new Map<string, WritableSignal<Mensaje | null>>();
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
            const mensajesCol = collection(this.firestore, this.COLLECTION);
            const mensajesQuery = query(mensajesCol, orderBy('fechaEnvio', 'desc'));

            onSnapshot(mensajesQuery, (snapshot) => {
                this.runInZone(() => {
                    const mensajes: Mensaje[] = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            ...data,
                            id: doc.id,
                            fechaEnvio: data['fechaEnvio'] instanceof Timestamp
                                ? data['fechaEnvio'].toDate()
                                : new Date(data['fechaEnvio']),
                            fechaLeido: data['fechaLeido'] instanceof Timestamp
                                ? data['fechaLeido'].toDate()
                                : data['fechaLeido'] ? new Date(data['fechaLeido']) : undefined,
                            fechaEditado: data['fechaEditado'] instanceof Timestamp
                                ? data['fechaEditado'].toDate()
                                : data['fechaEditado'] ? new Date(data['fechaEditado']) : undefined
                        } as Mensaje;
                    });
                    this._mensajes.set(mensajes);
                });
            }, (error) => {
                console.error('❌ MensajeService: Error en listener:', error);
                this._mensajes.set([]);
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
        if (!this.isListenerInitialized) {
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

            const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(mensajeDoc, (snapshot: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        mensajeSignal.set({
                            ...data,
                            id: snapshot.id,
                            fechaEnvio: data['fechaEnvio'] instanceof Timestamp
                                ? data['fechaEnvio'].toDate()
                                : new Date(data['fechaEnvio']),
                            fechaLeido: data['fechaLeido'] instanceof Timestamp
                                ? data['fechaLeido'].toDate()
                                : data['fechaLeido'] ? new Date(data['fechaLeido']) : undefined,
                            fechaEditado: data['fechaEditado'] instanceof Timestamp
                                ? data['fechaEditado'].toDate()
                                : data['fechaEditado'] ? new Date(data['fechaEditado']) : undefined
                        } as Mensaje);
                    } else {
                        mensajeSignal.set(null);
                    }
                });
            }, (error) => {
                console.error('❌ MensajeService: Error al suscribirse:', error);
                mensajeSignal.set(null);
            });
        }
        return this.mensajeSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un mensaje
     */
    async save(mensaje: Mensaje): Promise<void> {
        try {
            await this.runInZone(async () => {
                const mensajeData = {
                    ...mensaje,
                    fechaEnvio: mensaje.fechaEnvio instanceof Date
                        ? Timestamp.fromDate(mensaje.fechaEnvio)
                        : Timestamp.now(),
                    fechaLeido: mensaje.fechaLeido instanceof Date
                        ? Timestamp.fromDate(mensaje.fechaLeido)
                        : null,
                    fechaEditado: mensaje.fechaEditado instanceof Date
                        ? Timestamp.fromDate(mensaje.fechaEditado)
                        : null
                };

                if (mensaje.id) {
                    const mensajeDoc = doc(this.firestore, this.COLLECTION, mensaje.id);
                    await setDoc(mensajeDoc, mensajeData, { merge: true });
                } else {
                    const mensajesCol = collection(this.firestore, this.COLLECTION);
                    await addDoc(mensajesCol, mensajeData);
                }
            });
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina un mensaje por ID
     */
    async delete(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
                await deleteDoc(mensajeDoc);
            });
        } catch (error) {
            console.error('Error al eliminar mensaje:', error);
            throw error;
        }
    }

    /**
     * ✅ Marca un mensaje como leído
     */
    async marcarComoLeido(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
                await updateDoc(mensajeDoc, {
                    leido: true,
                    fechaLeido: Timestamp.now()
                });
            });
        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            throw error;
        }
    }

    /**
     * 📩 Marca un mensaje como entregado
     */
    async marcarComoEntregado(id: string): Promise<void> {
        try {
            await this.runInZone(async () => {
                const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
                await updateDoc(mensajeDoc, {
                    entregado: true
                });
            });
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
    getContadorNoLeidas(destinatarioId: string): Signal<number> {
        return computed(() =>
            this._mensajes().filter(msg =>
                msg.destinatarioId === destinatarioId && !msg.leido
            ).length
        );
    }

    /**
     * 📋 Obtiene mensajes por entrenador (enviados o recibidos)
     */
    getMensajesByEntrenador(entrenadorId: string): Signal<Mensaje[]> {
        return computed(() =>
            this._mensajes().filter(msg =>
                msg.remitenteId === entrenadorId || msg.destinatarioId === entrenadorId
            )
        );
    }
}

