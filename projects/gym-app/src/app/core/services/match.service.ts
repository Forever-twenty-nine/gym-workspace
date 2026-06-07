import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    QuerySnapshot,
    DocumentSnapshot,
    updateDoc
} from 'firebase/firestore';
import { MatchInteraction, Entrenado, Rol, TipoMensaje, TipoNotificacion } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';
import { EntrenadoService } from './entrenado.service';
import { MensajeService } from './mensaje.service';
import { NotificacionService } from './notificacion.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'matches';

    private readonly entrenadoService = inject(EntrenadoService);
    private readonly mensajeService = inject(MensajeService);
    private readonly notificacionService = inject(NotificacionService);
    private readonly userService = inject(UserService);

    private readonly _interactions: WritableSignal<MatchInteraction[]> = signal<MatchInteraction[]>([]);
    private isListenerInitialized = false;

    constructor() { }

    /**
     * Retorna una señal reactiva con todas las interacciones de match que involucran al usuario
     */
    getInteractions(userId: string): Signal<MatchInteraction[]> {
        this.initializeListener(userId);
        return this._interactions.asReadonly();
    }

    private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
        if (this.zoneRunner) {
            return this.zoneRunner.run(callback);
        }
        return runInInjectionContext(this.injector, callback as any);
    }

    private initializeListener(userId: string): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            // Escuchar interacciones que involucran al usuario actual
            const q = query(col, where('usuarioOrigenId', '==', userId));
            onSnapshot(q, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._interactions.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de matches:', e);
        }
    }

    /**
     * Registra el interés de un usuario sobre otro o sobre un desafío.
     * Si el otro usuario ya había registrado interés previamente, se genera un MATCH MUTUO.
     */
    async registrarInteres(
        usuarioOrigenId: string,
        usuarioDestinoId: string,
        tipo: 'horario' | 'desafio' | 'afinidad',
        referenciaId?: string
    ): Promise<boolean> {
        this.initializeListener(usuarioOrigenId);

        return this.runInZone(async () => {
            const matchesCol = collection(this.firestore, this.COLLECTION);

            // 1. Buscar si existe interés inverso previo
            const qInverse = query(
                matchesCol,
                where('usuarioOrigenId', '==', usuarioDestinoId),
                where('usuarioDestinoId', '==', usuarioOrigenId),
                where('tipo', '==', tipo)
            );

            // Obtener documentos de coincidencia inversa
            let inverseMatchDoc: any = null;
            await new Promise<void>((resolve) => {
                onSnapshot(qInverse, (snap) => {
                    if (!snap.empty) {
                        const docData = snap.docs[0];
                        inverseMatchDoc = { ...docData.data(), id: docData.id };
                    }
                    resolve();
                }, (err) => {
                    console.error(err);
                    resolve();
                });
            });

            // Si hay un desafío específico, validar referenciaId
            if (tipo === 'desafio' && inverseMatchDoc && inverseMatchDoc.referenciaId !== referenciaId) {
                inverseMatchDoc = null; // No corresponde al mismo desafío
            }

            if (inverseMatchDoc && inverseMatchDoc.interesOrigen === true) {
                // ¡HAY MATCH MUTUO!
                // A. Actualizar la interacción inversa
                const inverseRef = doc(this.firestore, this.COLLECTION, inverseMatchDoc.id);
                await updateDoc(inverseRef, {
                    interesDestino: true,
                    mutuo: true,
                    fechaMatch: Timestamp.now()
                });

                // B. Crear la interacción de origen ya marcada como mutua
                const interactionId = `match-${usuarioOrigenId}-${usuarioDestinoId}-${Date.now()}`;
                const newInteraction: MatchInteraction = {
                    id: interactionId,
                    tipo,
                    usuarioOrigenId,
                    usuarioDestinoId,
                    referenciaId,
                    interesOrigen: true,
                    interesDestino: true,
                    mutuo: true,
                    fechaCreacion: new Date(),
                    fechaMatch: new Date()
                };
                await setDoc(doc(this.firestore, this.COLLECTION, interactionId), this.mapToFirestore(newInteraction));

                // C. Crear un mensaje de bienvenida automático en el chat para habilitar la conversación
                const msgId = `msg-welcome-${usuarioOrigenId}-${usuarioDestinoId}-${Date.now()}`;
                const originUser = this.userService.getUserByUid(usuarioOrigenId)();
                const originName = originUser?.nombre || 'Un atleta';
                
                let contenido = `¡Conexión establecida! Nos interesa entrenar a la misma hora o compartir el mismo estilo de vida. ¡Empecemos a coordinar!`;
                if (tipo === 'desafio') {
                    contenido = `“A vos y a ${originName} les gusta el mismo ritmo. ¿Por qué no arman un grupo?”`;
                } else if (tipo === 'afinidad') {
                    contenido = `¡Hay equipo! Encontramos a tu partner ideal para esta semana. ¡Vamos a entrenar!`;
                }

                await this.mensajeService.save({
                    id: msgId,
                    remitenteId: usuarioOrigenId,
                    remitenteTipo: Rol.ENTRENADO,
                    destinatarioId: usuarioDestinoId,
                    destinatarioTipo: Rol.ENTRENADO,
                    contenido: contenido,
                    tipo: TipoMensaje.TEXTO,
                    leido: false,
                    entregado: true,
                    fechaEnvio: new Date()
                });

                // D. Notificar a AMBOS usuarios con contexto claro del "por qué" del match
                const targetUserForNotif = this.userService.getUserByUid(usuarioDestinoId)();
                const targetName = targetUserForNotif?.nombre || 'Un atleta';

                const matchReason = this.buildMatchReasonMessage(tipo, originName, targetName);

                // Notificación para el que inició el último "chocar los 5"
                await this.notificacionService.save({
                    id: `notif-match-${interactionId}-for-origin`,
                    usuarioId: usuarioOrigenId,
                    tipo: TipoNotificacion.NUEVO_MATCH,
                    titulo: '¡Chocaste los 5! Nuevo match',
                    mensaje: matchReason.forOrigin,
                    leida: false,
                    fechaCreacion: new Date(),
                    datos: {
                        matchId: interactionId,
                        tipoMatch: tipo,
                        partnerId: usuarioDestinoId,
                        partnerName: targetName
                    }
                });

                // Notificación para el otro usuario
                await this.notificacionService.save({
                    id: `notif-match-${interactionId}-for-target`,
                    usuarioId: usuarioDestinoId,
                    tipo: TipoNotificacion.NUEVO_MATCH,
                    titulo: '¡Chocaste los 5! Nuevo match',
                    mensaje: matchReason.forTarget,
                    leida: false,
                    fechaCreacion: new Date(),
                    datos: {
                        matchId: interactionId,
                        tipoMatch: tipo,
                        partnerId: usuarioOrigenId,
                        partnerName: originName
                    }
                });

                return true; // Match concretado
            } else {
                // No hay interés inverso previo, registrar interés inicial
                const interactionId = `match-${usuarioOrigenId}-${usuarioDestinoId}-${Date.now()}`;
                const newInteraction: MatchInteraction = {
                    id: interactionId,
                    tipo,
                    usuarioOrigenId,
                    usuarioDestinoId,
                    referenciaId,
                    interesOrigen: true,
                    mutuo: false,
                    fechaCreacion: new Date()
                };
                await setDoc(doc(this.firestore, this.COLLECTION, interactionId), this.mapToFirestore(newInteraction));
                return false; // Esperando interés mutuo
            }
        });
    }

    /**
     * Obtener sugerencias para la Tarjeta de Utilidad (Coincidencia horaria)
     */
    getSugerenciasHorario(currentUser: Entrenado): Signal<Entrenado[]> {
        return computed(() => {
            const all = this.entrenadoService.entrenados();
            if (!currentUser || !currentUser.franjaHoraria) return [];

            const currentUserProfile = this.userService.getUserByUid(currentUser.id)();
            const currentUserGymId = currentUserProfile?.gimnasioId;

            return all.filter(e => {
                if (e.id === currentUser.id) return false;
                if (e.visibleDescubrir === false) return false;

                const targetUserProfile = this.userService.getUserByUid(e.id)();
                if (targetUserProfile?.gimnasioId !== currentUserGymId) return false;

                if (!e.franjaHoraria) return false;

                // Comprobar solapamiento de rango de horas
                const currentStart = this.parseTimeToMinutes(currentUser.franjaHoraria!.inicio);
                const currentEnd = this.parseTimeToMinutes(currentUser.franjaHoraria!.fin);
                const targetStart = this.parseTimeToMinutes(e.franjaHoraria.inicio);
                const targetEnd = this.parseTimeToMinutes(e.franjaHoraria.fin);

                return (currentStart < targetEnd && currentEnd > targetStart);
            });
        });
    }

    /**
     * Obtener sugerencias para la Tarjeta Social Pura (Afinidad por estilo de vida / Objetivo)
     */
    getSugerenciasAfinidad(currentUser: Entrenado): Signal<Entrenado[]> {
        return computed(() => {
            const all = this.entrenadoService.entrenados();
            if (!currentUser || !currentUser.objetivo) return [];

            const currentUserProfile = this.userService.getUserByUid(currentUser.id)();
            const currentUserGymId = currentUserProfile?.gimnasioId;

            return all.filter(e => {
                if (e.id === currentUser.id) return false;
                if (e.visibleDescubrir === false) return false;

                const targetUserProfile = this.userService.getUserByUid(e.id)();
                if (targetUserProfile?.gimnasioId !== currentUserGymId) return false;

                // Comprobar si comparten el mismo objetivo de entrenamiento
                return e.objetivo === currentUser.objetivo;
            });
        });
    }

    private parseTimeToMinutes(timeStr: string): number {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        if (parts.length < 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    /**
     * Genera mensajes contextuales para notificaciones de match mutuo.
     * Explica claramente "el por qué" del match a ambos usuarios.
     */
    private buildMatchReasonMessage(
        tipo: 'horario' | 'desafio' | 'afinidad',
        originName: string,
        targetName: string
    ): { forOrigin: string; forTarget: string } {
        if (tipo === 'afinidad') {
            const msg = `¡Hay equipo! ${originName} y ${targetName} comparten el mismo objetivo de entrenamiento. ¡Chocaron los 5 y ahora pueden coordinar!`;
            return {
                forOrigin: `¡Match con ${targetName}! Comparten el mismo objetivo. ¡A entrenar juntos!`,
                forTarget: `¡Match con ${originName}! Comparten el mismo objetivo. ¡A entrenar juntos!`
            };
        }

        if (tipo === 'horario') {
            const msg = `¡Perfecto! ${originName} y ${targetName} tienen horarios que coinciden. ¡Chocaron los 5!`;
            return {
                forOrigin: `¡Match con ${targetName}! Sus horarios de entrenamiento coinciden. ¡Buen momento para entrenar en equipo!`,
                forTarget: `¡Match con ${originName}! Sus horarios de entrenamiento coinciden. ¡Buen momento para entrenar en equipo!`
            };
        }

        // desafio
        return {
            forOrigin: `¡Reto aceptado! ${targetName} también está en el mismo desafío. ¡Chocaron los 5!`,
            forTarget: `¡Reto aceptado! ${originName} se unió a tu desafío. ¡Chocaron los 5!`
        };
    }

    private mapFromFirestore(data: any): MatchInteraction {
        return {
            id: data.id,
            tipo: data.tipo,
            usuarioOrigenId: data.usuarioOrigenId,
            usuarioDestinoId: data.usuarioDestinoId,
            referenciaId: data.referenciaId || null,
            interesOrigen: data.interesOrigen ?? false,
            interesDestino: data.interesDestino ?? false,
            mutuo: data.mutuo ?? false,
            fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
            fechaMatch: data.fechaMatch instanceof Timestamp ? data.fechaMatch.toDate() : (data.fechaMatch ? new Date(data.fechaMatch) : undefined)
        };
    }

    private mapToFirestore(interaction: MatchInteraction): any {
        const data: any = {
            tipo: interaction.tipo,
            usuarioOrigenId: interaction.usuarioOrigenId,
            usuarioDestinoId: interaction.usuarioDestinoId,
            interesOrigen: interaction.interesOrigen,
            mutuo: interaction.mutuo ?? false,
            fechaCreacion: interaction.fechaCreacion instanceof Date ? Timestamp.fromDate(interaction.fechaCreacion) : interaction.fechaCreacion
        };

        if (interaction.referenciaId) data.referenciaId = interaction.referenciaId;
        if (interaction.interesDestino !== undefined) data.interesDestino = interaction.interesDestino;
        if (interaction.fechaMatch) {
            data.fechaMatch = interaction.fechaMatch instanceof Date ? Timestamp.fromDate(interaction.fechaMatch) : interaction.fechaMatch;
        }

        return data;
    }
}
