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
    QuerySnapshot,
    DocumentSnapshot,
    where,
    limit
} from 'firebase/firestore';
import { Mensaje } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../core/firebase.tokens';

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
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, orderBy('fechaEnvio', 'desc'));
            onSnapshot(q, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._mensajes.set(list);
                });
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

            const mensajeRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(mensajeRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        mensajeSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        mensajeSignal.set(null);
                    }
                });
            });
        }
        return this.mensajeSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un mensaje
     */
    async save(mensaje: Mensaje): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(mensaje);
            if (mensaje.id) {
                const mensajeRef = doc(this.firestore, this.COLLECTION, mensaje.id);
                await setDoc(mensajeRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                await addDoc(col, dataToSave);
            }
        });
    }

    /**
     * 🗑️ Elimina un mensaje por ID
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const mensajeRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(mensajeRef);
        });
    }

    /**
     * ✅ Marca un mensaje como leído
     */
    async marcarComoLeido(id: string): Promise<void> {
        return this.runInZone(async () => {
            const mensajeRef = doc(this.firestore, this.COLLECTION, id);
            await updateDoc(mensajeRef, {
                leido: true,
                fechaLeido: Timestamp.now()
            });
        });
    }

    /**
     * 📩 Marca un mensaje como entregado
     */
    async marcarComoEntregado(id: string): Promise<void> {
        return this.runInZone(async () => {
            const mensajeRef = doc(this.firestore, this.COLLECTION, id);
            await updateDoc(mensajeRef, {
                entregado: true
            });
        });
    }

    /**
     * 🔍 Obtiene mensajes enviados por un usuario
     */
    getMensajesByRemitente(remitenteId: string): Signal<Mensaje[]> {
        return computed(() =>
            this.mensajes().filter(msg => msg.remitenteId === remitenteId)
        );
    }

    /**
     * 🔍 Obtiene mensajes recibidos por un usuario
     */
    getMensajesByDestinatario(destinatarioId: string): Signal<Mensaje[]> {
        return computed(() =>
            this.mensajes().filter(msg => msg.destinatarioId === destinatarioId)
        );
    }

    /**
     * 📊 Obtiene mensajes no leídos para un usuario
     */
    getMensajesNoLeidos(destinatarioId: string): Signal<Mensaje[]> {
        return computed(() =>
            this.mensajes().filter(msg =>
                msg.destinatarioId === destinatarioId && !msg.leido
            )
        );
    }

    /**
     * 📊 Contador de mensajes no leídos
     */
    getContadorNoLeidos(destinatarioId: string): Signal<number> {
        return computed(() =>
            this.mensajes().filter(msg =>
                msg.destinatarioId === destinatarioId && !msg.leido
            ).length
        );
    }

    /**
     * 📋 Obtiene mensajes por entrenador (enviados o recibidos)
     */
    getMensajesByEntrenador(entrenadorId: string): Signal<Mensaje[]> {
        return computed(() =>
            this.mensajes().filter(msg =>
                msg.remitenteId === entrenadorId || msg.destinatarioId === entrenadorId
            )
        );
    }

    private mapFromFirestore(data: any): Mensaje {
        return {
            ...data,
            id: data.id,
            fechaEnvio: data.fechaEnvio instanceof Timestamp ? data.fechaEnvio.toDate() : (data.fechaEnvio ? new Date(data.fechaEnvio) : new Date()),
            fechaLeido: data.fechaLeido instanceof Timestamp ? data.fechaLeido.toDate() : (data.fechaLeido ? new Date(data.fechaLeido) : undefined),
            fechaEditado: data.fechaEditado instanceof Timestamp ? data.fechaEditado.toDate() : (data.fechaEditado ? new Date(data.fechaEditado) : undefined)
        } as Mensaje;
    }

    private mapToFirestore(mensaje: Mensaje): any {
        return {
            ...mensaje,
            fechaEnvio: mensaje.fechaEnvio instanceof Date ? Timestamp.fromDate(mensaje.fechaEnvio) : (mensaje.fechaEnvio || Timestamp.now()),
            fechaLeido: mensaje.fechaLeido instanceof Date ? Timestamp.fromDate(mensaje.fechaLeido) : (mensaje.fechaLeido || null),
            fechaEditado: mensaje.fechaEditado instanceof Date ? Timestamp.fromDate(mensaje.fechaEditado) : (mensaje.fechaEditado || null)
        };
    }
}

