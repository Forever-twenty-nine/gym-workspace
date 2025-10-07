import { Ejercicio } from "./ejercicio.model";
import { Rol } from "gym-library";

export interface Rutina {
    id: string;
    clienteId?: string; // Campo de compatibilidad - usar asignadoId como principal
    nombre: string;
    fechaAsignacion: Date;
    ejercicios?: Ejercicio[];
    activa: boolean;
    entrenadorId?: string; // Deprecado - usar creadorId
    gimnasioId?: string;
    duracion?: number;
    DiasSemana?: number[];
    completado?: boolean;
    notas?: string;
    // Nuevos campos principales
    creadorId?: string;
    creadorTipo?: Rol;
    asignadoId?: string;
    asignadoTipo?: Rol;
    // Metadatos
    fechaCreacion?: Date;
    fechaModificacion?: Date;
}
