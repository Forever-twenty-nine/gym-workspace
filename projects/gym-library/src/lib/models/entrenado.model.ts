import { Objetivo } from '../enums/objetivo.enum';

export interface Entrenado {
    id: string;
    gimnasioId: string;
    entrenadorId?: string;
    activo: boolean;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
   
}
