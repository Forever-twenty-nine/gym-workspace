import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    // plan free
    creadorId?: string;
    nombre: string;
    activa: boolean;
    descripcion?: string;
    ejerciciosIds?: string[];
    // Social
    compartida?: boolean;
    usuarioId?: string;
    nombreUsuario?: string;
    fechaCompartida?: any;
    // Plan Premium
    duracion?: number;
    // Días de la semana (para rutinas personales del entrenado y rutinas de entrenador)
    diasSemana?: string[];
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}
