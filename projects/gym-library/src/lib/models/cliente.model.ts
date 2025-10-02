import { Objetivo } from '../enums/objetivo.enum';
import { Rutina } from './rutina.model';

/**
 * Datos específicos del cliente.
 * El ID del documento es igual al UID del usuario en Firebase Auth.
 */
export interface Cliente {
    id: string;
    gimnasioId: string;
    entrenadorId?: string;
    activo: boolean;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    rutinas?: Rutina[];
}
  