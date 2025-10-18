import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    nombre: string;
    activa: boolean;   
    descripcion?: string;
    ejercicios?: Ejercicio[];
    completado?: boolean;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    // Plan Premium
    DiasSemana?: string[];
    duracion?: number;
}
