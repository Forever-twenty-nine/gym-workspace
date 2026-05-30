import { Injectable, inject, signal } from '@angular/core';
import {
    Firestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { MatchInteraction } from 'gym-library';
import { FIRESTORE } from './firebase.tokens';

@Injectable({
    providedIn: 'root'
})
export class MatchAdminService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'matches';

    private _matches = signal<MatchInteraction[]>([]);
    public matches = this._matches.asReadonly();

    constructor() {
        this.initListener();
    }

    private initListener() {
        try {
            const colRef = collection(this.firestore, this.COLLECTION);
            const q = query(colRef, orderBy('fechaCreacion', 'desc'));

            onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => {
                    const data = doc.data() as any;
                    return {
                        id: doc.id,
                        tipo: data.tipo,
                        usuarioOrigenId: data.usuarioOrigenId,
                        usuarioDestinoId: data.usuarioDestinoId,
                        referenciaId: data.referenciaId || null,
                        interesOrigen: data.interesOrigen ?? false,
                        interesDestino: data.interesDestino ?? false,
                        mutuo: data.mutuo ?? false,
                        fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion),
                        fechaMatch: data.fechaMatch instanceof Timestamp ? data.fechaMatch.toDate() : (data.fechaMatch ? new Date(data.fechaMatch) : undefined)
                    } as MatchInteraction;
                });
                this._matches.set(list);
            }, (error) => {
                console.warn('Error en listener de matches admin:', error);
            });
        } catch (e) {
            console.warn('Error inicializando listener de matches admin:', e);
        }
    }
}
