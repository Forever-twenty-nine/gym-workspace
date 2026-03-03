import { Injectable, inject, signal } from '@angular/core';
import {
    Firestore,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { SolicitudPlan, Plan } from 'gym-library';
import { FIRESTORE } from './firebase.tokens';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class PlanService {
    private readonly firestore = inject(FIRESTORE);
    private readonly userService = inject(UserService);
    private readonly COLLECTION = 'solicitudes_plan';

    private _solicitudes = signal<SolicitudPlan[]>([]);
    public solicitudes = this._solicitudes.asReadonly();

    constructor() {
        this.initListener();
    }

    private initListener() {
        const colRef = collection(this.firestore, this.COLLECTION);
        const q = query(colRef, orderBy('fechaCreacion', 'desc'));

        onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as SolicitudPlan[];
            this._solicitudes.set(list);
        });
    }

    /**
     * Aprueba o rechaza una solicitud de plan
     */
    async responderSolicitud(solicitud: SolicitudPlan, aprobada: boolean, motivo?: string): Promise<void> {
        const solicitudRef = doc(this.firestore, this.COLLECTION, solicitud.id);

        const estado = aprobada ? 'aprobada' : 'rechazada';

        await updateDoc(solicitudRef, {
            estado: estado,
            fechaRespuesta: Timestamp.now(),
            ...(motivo && { motivoRechazo: motivo })
        });

        if (aprobada) {
            // Actualizar el plan del usuario
            await this.userService.updateUser(solicitud.userId, {
                plan: solicitud.planSolicitado
            });
        }
    }
}
