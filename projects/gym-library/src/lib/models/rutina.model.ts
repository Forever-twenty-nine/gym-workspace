import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    nombre: string;
    activa: boolean;   
    descripcion?: string;
    ejercicios?: Ejercicio[];
    completado?: boolean;
    // Información del creador
    creadorId?: string; 
    creadorTipo?: Rol;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    // Plan Premium
    DiasSemana?: number[];
    duracion?: number;
}
