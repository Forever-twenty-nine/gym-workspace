import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    entrenadoId?: string;
    nombre: string;
    fechaAsignacion: Date;
    ejercicios?: Ejercicio[];
    activa: boolean;
    duracion?: number;
    DiasSemana?: number[];
    completado?: boolean;
    notas?: string;
    // Información del creador (opcional)
    creadorId?: string; 
    creadorTipo?: Rol;
    // Información del asignado (opcional) - puede ser uno o múltiples
    asignadoId?: string;  // Mantener para compatibilidad
    asignadoIds?: string[];  // Nuevo campo para múltiples asignados
    asignadoTipo?: Rol;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;

}
