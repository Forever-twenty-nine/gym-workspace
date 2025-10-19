export interface Invitacion {
    id: string;
    entrenadorId: string;           // Quién envía la invitación
    entrenadoId: string;            // Quién recibe la invitación
    entrenadorNombre: string;       // Nombre del entrenador (para display)
    entrenadoNombre: string;        // Nombre del entrenado (para display)
    emailEntrenado: string;         // Email del entrenado
    estado: 'pendiente' | 'aceptada' | 'rechazada';
    mensajePersonalizado?: string;  // Mensaje opcional del entrenador

    // Fechas
    fechaCreacion: Date;
    fechaRespuesta?: Date;

    // Metadata
    activa: boolean;                // Si la invitación sigue siendo válida
}