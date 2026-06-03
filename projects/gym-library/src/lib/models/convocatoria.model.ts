export interface Convocatoria {
    id: string;
    creadorId: string;
    creadorNombre: string;
    creadorFoto?: string | null;
    gimnasioId: string;
    fechaCreacion: Date;
    fechaEntrenamiento: Date; // día en que se entrenará (formato Date)
    horaInicio: string; // Formato "HH:mm"
    horaFin: string;    // Formato "HH:mm"
    mensaje?: string;   // Nota/Objetivo opcional
    interesados: string[]; // UIDs de usuarios que "chocaron los 5"
    activo: boolean;
}
