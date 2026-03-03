import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    doc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { User, Plan, SolicitudPlan } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'solicitudes_plan';

    /**
     * Crea una nueva solicitud para plan Premium
     */
    async solicitarPremium(user: User): Promise<string> {
        const solicitud: Omit<SolicitudPlan, 'id'> = {
            userId: user.uid,
            userName: user.nombre || 'Usuario',
            userEmail: user.email || '',
            planActual: user.plan || Plan.FREE,
            planSolicitado: Plan.PREMIUM,
            estado: 'pendiente',
            fechaCreacion: Timestamp.now()
        };

        const colRef = collection(this.firestore, this.COLLECTION);
        const docRef = await addDoc(colRef, solicitud);
        return docRef.id;
    }

    /**
     * Obtiene la última solicitud del usuario
     */
    async getUltimaSolicitud(userId: string): Promise<SolicitudPlan | null> {
        const colRef = collection(this.firestore, this.COLLECTION);
        const q = query(
            colRef,
            where('userId', '==', userId),
            orderBy('fechaCreacion', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const data = snapshot.docs[0].data();
        return {
            ...data,
            id: snapshot.docs[0].id
        } as SolicitudPlan;
    }

    /**
     * Escucha cambios en las solicitudes del usuario
     */
    getSolicitudesUsuarioListener(userId: string, callback: (solicitudes: SolicitudPlan[]) => void) {
        const colRef = collection(this.firestore, this.COLLECTION);
        const q = query(
            colRef,
            where('userId', '==', userId),
            orderBy('fechaCreacion', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const solicitudes = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as SolicitudPlan[];
            callback(solicitudes);
        });
    }
}
