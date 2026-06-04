export type DesafioEstado = 'aceptado' | 'superado' | 'no_superado';

export interface DesafioParticipacion {
    id: string;
    desafioId: string;
    participanteId: string;
    participanteNombre: string;
    participanteFoto?: string | null;
    estado: DesafioEstado;         // aceptado → superado | no_superado
    fechaAceptacion: Date;
    fechaRespuesta?: Date;          // cuando declara si lo superó o no
}
