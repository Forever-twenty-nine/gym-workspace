import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    nombre: string;
    activa: boolean;   
    descripcion?: string;
    ejerciciosIds?: string[]; // Array de IDs de ejercicios
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    // Plan Premium
    duracion?: number;
}
