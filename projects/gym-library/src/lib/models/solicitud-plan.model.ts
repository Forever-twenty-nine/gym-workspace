import { Plan } from '../enums/plan.enum';

export interface SolicitudPlan {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    planActual: Plan;
    planSolicitado: Plan;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    fechaCreacion: any; // Timestamp de Firestore
    fechaRespuesta?: any;
    motivoRechazo?: string;
}
