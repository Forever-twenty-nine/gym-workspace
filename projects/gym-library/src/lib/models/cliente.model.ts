import { Objetivo } from '../enums/objetivo.enum';
import { Rutina } from './rutina.model';

export interface Cliente {
    id: string;
    gimnasioId: string;
    entrenadorId?: string;
    activo: boolean;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
   
}
  