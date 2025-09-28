import { Ejercicio } from "./ejercicio.model";

export interface Rutina {
    id: string;
    clienteId?: string;
    nombre: string;
    fechaAsignacion: Date;
    ejercicios?: Ejercicio[];
    activa: boolean;
    entrenadorId?: string;
    gimnasioId?: string;
    duracion?: number;
    DiasSemana?: number[];
    completado?: boolean;
    notas?: string;
}
