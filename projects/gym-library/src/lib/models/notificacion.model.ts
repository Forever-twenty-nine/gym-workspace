import { TipoNotificacion } from '../enums/tipo-notificacion.enum';

export interface Notificacion {
    id: string;
    usuarioId: string;              // A quién va dirigida
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    leida: boolean;

    // Datos adicionales según tipo (opcional)
    datos?: {
        // Para invitaciones
        entrenadorId?: string;
        entrenadorNombre?: string;
        emailInvitado?: string;
        estadoInvitacion?: 'pendiente' | 'aceptada' | 'rechazada';
        fechaRespuesta?: Date;

        // Para rutinas
        rutinaId?: string;
        rutinaNombre?: string;

        // Para mensajes
        mensajeId?: string;
        remitenteId?: string;
        remitenteNombre?: string;

        // Genérico para otros tipos
        [key: string]: any;
    };

    // Metadata
    fechaCreacion: Date;
    fechaLeida?: Date;
}
