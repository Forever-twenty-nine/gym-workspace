import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector } from '@angular/core';
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
    updateDoc,
    getDocs
} from 'firebase/firestore';
import { MatchInteraction, Entrenado, Rol, TipoMensaje, TipoNotificacion } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';
import { EntrenadoService } from './entrenado.service';
import { MensajeService } from './mensaje.service';
import { NotificacionService } from './notificacion.service';
import { UserService } from './user.service';
import { DesafioService } from './desafio.service';
import { TarjetaDescubrir } from '../types/descubrir.types';

@Injectable({ providedIn: 'root' })
export class MatchService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly COLLECTION = 'matches';

    private readonly entrenadoService = inject(EntrenadoService);
    private readonly mensajeService = inject(MensajeService);
    private readonly notificacionService = inject(NotificacionService);
    private readonly userService = inject(UserService);
    private readonly desafioService = inject(DesafioService);

    private readonly _interactions: WritableSignal<MatchInteraction[]> = signal<MatchInteraction[]>([]);
    private isListenerInitialized = false;

    constructor() { }

    /**
     * Retorna una señal reactiva con todas las interacciones de match que involucran al usuario.
     * Si se pasa gymId, el listener se inicializa con filtro adicional por gimnasio (para scoping).
     */
    getInteractions(userId: string, gymId?: string): Signal<MatchInteraction[]> {
        this.initializeListener(userId, gymId);
        return this._interactions.asReadonly();
    }


    private initializeListener(userId: string, gymId?: string): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);

            // Construir queries con filtro por gimnasio si se provee (para scoping en entrenados)
            let qOrigen = query(col, where('usuarioOrigenId', '==', userId));
            let qDestino = query(col, where('usuarioDestinoId', '==', userId));

            if (gymId) {
                qOrigen = query(col, where('usuarioOrigenId', '==', userId), where('gimnasioId', '==', gymId));
                qDestino = query(col, where('usuarioDestinoId', '==', userId), where('gimnasioId', '==', gymId));
            }

            // Escuchar interacciones donde el usuario es origen O destino
            onSnapshot(qOrigen, (snap) => {
                this.mergeInteractions(snap, userId);
            });

            onSnapshot(qDestino, (snap) => {
                this.mergeInteractions(snap, userId);
            });

            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de matches:', e);
        }
    }

    private mergeInteractions(snap: QuerySnapshot, userId: string) {
        const current = this._interactions();
        const newOnes = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
        const merged = new Map<string, MatchInteraction>();
        [...current, ...newOnes].forEach(i => merged.set(i.id, i));
        this._interactions.set(Array.from(merged.values()));
    }

    /**
     * Registra el interés de un usuario sobre otro o sobre un desafío.
     * Si el otro usuario ya había registrado interés previamente, se genera un MATCH MUTUO.
     */
    async registrarInteres(
        usuarioOrigenId: string,
        usuarioDestinoId: string,
        tipo: 'horario' | 'afinidad' | 'general',
        esInteres: boolean = true,
        referenciaId?: string
    ): Promise<boolean> {
        this.initializeListener(usuarioOrigenId);

            const matchesCol = collection(this.firestore, this.COLLECTION);

            // Obtener gimnasioId del usuario origen para denormalizarlo en el match
            const originUserProfile = this.userService.getUserByUid(usuarioOrigenId)();
            const gimnasioId = originUserProfile?.gimnasioId;

            // 1. Buscar si existe interés inverso previo (one-time read, sin listener)
            const qInverse = query(
                matchesCol,
                where('usuarioOrigenId', '==', usuarioDestinoId),
                where('usuarioDestinoId', '==', usuarioOrigenId),
                where('tipo', '==', tipo)
            );

            const inverseSnap = await getDocs(qInverse);
            let inverseMatchDoc: any = null;
            if (!inverseSnap.empty) {
                const docData = inverseSnap.docs[0];
                inverseMatchDoc = { ...docData.data(), id: docData.id };
            }

            if (esInteres && inverseMatchDoc && inverseMatchDoc.interesOrigen === true) {
                // ¡HAY MATCH MUTUO!
                // A. Actualizar la interacción inversa
                const inverseRef = doc(this.firestore, this.COLLECTION, inverseMatchDoc.id);
                await updateDoc(inverseRef, {
                    interesDestino: true,
                    mutuo: true,
                    fechaMatch: Timestamp.now(),
                    ...(gimnasioId && { gimnasioId })   // asegurar denormalización
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
                    fechaMatch: new Date(),
                    gimnasioId
                };
                await setDoc(doc(this.firestore, this.COLLECTION, interactionId), this.mapToFirestore(newInteraction));

                // C. Crear un mensaje de bienvenida automático en el chat para habilitar la conversación
                const msgId = `msg-welcome-${usuarioOrigenId}-${usuarioDestinoId}-${Date.now()}`;
                const originUser = this.userService.getUserByUid(usuarioOrigenId)();
                const originName = originUser?.nombre || 'Un atleta';
                
                let contenido = `¡Conexión establecida! ¡Empecemos a coordinar para entrenar en equipo!`;
                if (tipo === 'horario') {
                    contenido = `¡Conexión establecida! Nos interesa entrenar en un horario similar. ¡Empecemos a coordinar!`;
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
                    interesOrigen: esInteres,
                    mutuo: false,
                    fechaCreacion: new Date(),
                    gimnasioId
                };
                await setDoc(doc(this.firestore, this.COLLECTION, interactionId), this.mapToFirestore(newInteraction));
                return false; // Esperando interés mutuo
            }
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
     * Construye el mazo completo de tarjetas para el tab Descubrir:
     * sugerencias por horario, por afinidad y desafíos activos del gimnasio,
     * filtrando las tarjetas con las que el usuario ya interactuó.
     *
     * Centralizado aquí para mantener toda la lógica de matching en el servicio.
     */
    getTarjetasDescubrir(entrenado: Entrenado, gymId: string): Signal<TarjetaDescubrir[]> {
        return computed(() => {
            const all = this.entrenadoService.entrenados();
            const interactions = this.getInteractions(entrenado.id, gymId)();
            const _ = this.userService.users(); // dependencia reactiva: re-computa cuando llegan los usuarios

            const interactedIds = new Set(
                interactions.map(i => i.referenciaId || i.usuarioDestinoId)
            );

            const currentUserProfile = this.userService.getUserByUid(entrenado.id)();
            const currentUserGymId = currentUserProfile?.gimnasioId;

            const list: TarjetaDescubrir[] = [];

            for (const u of all) {
                if (u.id === entrenado.id || u.visibleDescubrir === false) continue;
                if (interactedIds.has(u.id)) continue;

                const targetProfile = this.userService.getUserByUid(u.id)();
                if (targetProfile?.gimnasioId !== currentUserGymId) continue;

                let tipoMatch: 'horario' | 'afinidad' | 'general' = 'general';

                // 1. Sugerencias por coincidencia horaria
                if (entrenado.franjaHoraria && u.franjaHoraria) {
                    const currentStart = this.parseTimeToMinutes(entrenado.franjaHoraria.inicio);
                    const currentEnd   = this.parseTimeToMinutes(entrenado.franjaHoraria.fin);
                    const targetStart = this.parseTimeToMinutes(u.franjaHoraria.inicio);
                    const targetEnd   = this.parseTimeToMinutes(u.franjaHoraria.fin);

                    if (currentStart < targetEnd && currentEnd > targetStart) {
                        tipoMatch = 'horario';
                    }
                }

                // 2. Sugerencias por afinidad de objetivo (si no hay match de horario)
                if (tipoMatch === 'general' && entrenado.objetivo && u.objetivo === entrenado.objetivo) {
                    tipoMatch = 'afinidad';
                }

                list.push({
                    id: `${tipoMatch}-${u.id}`,
                    tipo: tipoMatch,
                    data: u,
                    photoURL: targetProfile?.photoURL ?? null
                });
            }

            return list;
        });
    }

    /**
     * Construye el mensaje contextual que se muestra en el popup de match mutuo.
     * Centralizado en el servicio para mantener la lógica de negocio fuera de los componentes.
     */
    buildMatchPopupMessage(
        tipo: 'horario' | 'afinidad' | 'general',
        active: TarjetaDescubrir,
        partnerName: string
    ): string {
        if (tipo === 'horario') {
            return `¡Hay equipo para el turno tarde! A ambos les queda bien entrenar en el rango de ${active.data.franjaHoraria?.inicio} a ${active.data.franjaHoraria?.fin}.`;
        }
        if (tipo === 'afinidad') {
            return `¡Hay equipo! Encontramos a tu partner ideal para esta semana. ¿Vamos a entrenar?`;
        }
        return '';
    }

    /**
     * Genera mensajes contextuales para notificaciones de match mutuo.
     * Explica claramente "el por qué" del match a ambos usuarios.
     */
    private buildMatchReasonMessage(
        tipo: 'horario' | 'afinidad' | 'general',
        originName: string,
        targetName: string
    ): { forOrigin: string; forTarget: string } {
        if (tipo === 'afinidad') {
            return {
                forOrigin: `¡Match con ${targetName}! Comparten el mismo objetivo. ¡A entrenar juntos!`,
                forTarget: `¡Match con ${originName}! Comparten el mismo objetivo. ¡A entrenar juntos!`
            };
        }
        if (tipo === 'horario') {
            return {
                forOrigin: `¡Match con ${targetName}! Sus horarios de entrenamiento coinciden. ¡Buen momento para entrenar en equipo!`,
                forTarget: `¡Match con ${originName}! Sus horarios de entrenamiento coinciden. ¡Buen momento para entrenar en equipo!`
            };
        }
        return {
            forOrigin: `¡Match con ${targetName}! Es un buen momento para entrenar en equipo.`,
            forTarget: `¡Match con ${originName}! Es un buen momento para entrenar en equipo.`
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
            fechaMatch: data.fechaMatch instanceof Timestamp ? data.fechaMatch.toDate() : (data.fechaMatch ? new Date(data.fechaMatch) : undefined),
            gimnasioId: data.gimnasioId || undefined
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
        if (interaction.gimnasioId) {
            data.gimnasioId = interaction.gimnasioId;
        }

        return data;
    }
}
