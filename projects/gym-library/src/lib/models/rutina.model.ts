import { Rol } from "../enums/rol.enum";
import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    clienteId?: string;
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
    // Informacion del asignado (opcional)
    asignadoId?: string;
    asignadoTipo?: Rol;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;

}
