import { Cliente} from './cliente.model';
import { Ejercicio } from './ejercicio.model';
import { Rutina } from './rutina.model';

export interface Entrenador{
    id: string;          
    gimnasioId: string;
    activo: boolean;
    clientes: Cliente[];
    rutinas: Rutina[];
    ejercicios: Ejercicio[];

}