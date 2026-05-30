export interface Invitacion {
    id: string;
    
    // Campos polimórficos (Nuevos)
    remitenteId?: string;
    destinatarioId?: string;
    remitenteNombre?: string;
    destinatarioNombre?: string;
    emailDestinatario?: string;
    tipo?: 'gimnasio_a_entrenador' | 'entrenador_a_entrenado';

    // Campos legados para compatibilidad
    entrenadorId?: string;
    entrenadoId?: string;
    entrenadorNombre?: string;
    entrenadoNombre?: string;
    emailEntrenado?: string;

    estado: 'pendiente' | 'aceptada' | 'rechazada';
    mensajePersonalizado?: string;  // Mensaje opcional

    // Fechas
    fechaCreacion: Date;
    fechaRespuesta?: Date;

    // Metadata
    activa: boolean;                // Si la invitación sigue siendo válida
}