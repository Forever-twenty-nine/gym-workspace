import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    QuerySnapshot
} from 'firebase/firestore';
import { DesafioParticipacion, DesafioEstado } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class DesafioParticipacionService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'desafio_participaciones';

    // Cache por desafioId → Signal<DesafioParticipacion[]>
    private readonly participacionesCache = new Map<string, WritableSignal<DesafioParticipacion[]>>();
    // Cache por userId → Signal<DesafioParticipacion[]>  (las mías)
    private readonly misParticipaciones: WritableSignal<DesafioParticipacion[]> = signal([]);
    private misParticipacionesUserId: string | null = null;

    constructor() { }


    /** Retorna todas las participaciones de un desafío (para mostrar el conteo en la card) */
    getParticipacionesByDesafio(desafioId: string): Signal<DesafioParticipacion[]> {
        if (!this.participacionesCache.has(desafioId)) {
            const s = signal<DesafioParticipacion[]>([]);
            this.participacionesCache.set(desafioId, s);

            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, where('desafioId', '==', desafioId));
            onSnapshot(q, (snap: QuerySnapshot) => {
                s.set(snap.docs.map(d => this.mapFromFirestore({ ...d.data(), id: d.id })));
            });
        }
        return this.participacionesCache.get(desafioId)!.asReadonly();
    }

    /** Retorna las participaciones del usuario actual (para saber su estado en cada desafío) */
    getMisParticipaciones(userId: string): Signal<DesafioParticipacion[]> {
        if (this.misParticipacionesUserId !== userId) {
            this.misParticipacionesUserId = userId;
            const col = collection(this.firestore, this.COLLECTION);
            const q = query(col, where('participanteId', '==', userId));
            onSnapshot(q, (snap: QuerySnapshot) => {
                this.misParticipaciones.set(
                    snap.docs.map(d => this.mapFromFirestore({ ...d.data(), id: d.id }))
                );
            });
        }
        return this.misParticipaciones.asReadonly();
    }

    /** Acepta el desafío — crea participación con estado 'aceptado' */
    async aceptarDesafio(
        desafioId: string,
        userId: string,
        userNombre: string,
        userFoto?: string | null
    ): Promise<void> {
        const col = collection(this.firestore, this.COLLECTION);
        const data = {
            desafioId,
            participanteId: userId,
            participanteNombre: userNombre,
            participanteFoto: userFoto || null,
            estado: 'aceptado' as DesafioEstado,
            fechaAceptacion: Timestamp.now()
        };
        await addDoc(col, data);
    }

    /** Declara si el usuario superó o no el desafío */
    async declararResultado(participacionId: string, superado: boolean): Promise<void> {
        const docRef = doc(this.firestore, this.COLLECTION, participacionId);
        await updateDoc(docRef, {
            estado: (superado ? 'superado' : 'no_superado') as DesafioEstado,
            fechaRespuesta: Timestamp.now()
        });
    }

    private mapFromFirestore(data: any): DesafioParticipacion {
        return {
            id: data.id,
            desafioId: data.desafioId || '',
            participanteId: data.participanteId || '',
            participanteNombre: data.participanteNombre || 'Atleta',
            participanteFoto: data.participanteFoto || null,
            estado: data.estado || 'aceptado',
            fechaAceptacion: data.fechaAceptacion instanceof Timestamp
                ? data.fechaAceptacion.toDate()
                : new Date(data.fechaAceptacion),
            fechaRespuesta: data.fechaRespuesta instanceof Timestamp
                ? data.fechaRespuesta.toDate()
                : (data.fechaRespuesta ? new Date(data.fechaRespuesta) : undefined)
        };
    }
}
