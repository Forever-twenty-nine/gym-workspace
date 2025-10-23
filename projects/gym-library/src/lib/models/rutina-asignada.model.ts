export interface RutinaAsignada {
    id: string;
    rutinaId: string;
    entrenadoId: string;
    entrenadorId: string; // Quien asignó la rutina
    diaSemana?: string; // Día de la semana (opcional, para rutinas recurrentes)
    fechaEspecifica?: Date; // Fecha específica (opcional, para asignaciones puntuales)
    fechaAsignacion: Date;
    activa: boolean;
}