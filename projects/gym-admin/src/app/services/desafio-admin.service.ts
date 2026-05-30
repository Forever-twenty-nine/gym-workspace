import { Injectable, inject, signal } from '@angular/core';
import {
    Firestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { Desafio } from 'gym-library';
import { FIRESTORE } from './firebase.tokens';

@Injectable({
    providedIn: 'root'
})
export class DesafioAdminService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'desafios';

    private _desafios = signal<Desafio[]>([]);
    public desafios = this._desafios.asReadonly();

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
                        creadorId: data.creadorId || '',
                        creadorNombre: data.creadorNombre || '',
                        creadorFoto: data.creadorFoto || null,
                        titulo: data.titulo || '',
                        logroRelacionado: data.logroRelacionado || null,
                        disciplina: data.disciplina || null,
                        fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion),
                        activo: data.activo ?? true
                    } as Desafio;
                });
                this._desafios.set(list);
            }, (error) => {
                console.warn('Error en listener de desafios admin:', error);
            });
        } catch (e) {
            console.warn('Error inicializando listener de desafios admin:', e);
        }
    }

    /**
     * Activa o desactiva un desafío
     */
    async toggleActivo(desafioId: string, activoActual: boolean): Promise<void> {
        const desafioRef = doc(this.firestore, this.COLLECTION, desafioId);
        await updateDoc(desafioRef, {
            activo: !activoActual
        });
    }

    /**
     * Elimina permanentemente un desafío
     */
    async eliminarDesafio(desafioId: string): Promise<void> {
        const desafioRef = doc(this.firestore, this.COLLECTION, desafioId);
        await deleteDoc(desafioRef);
    }
}
