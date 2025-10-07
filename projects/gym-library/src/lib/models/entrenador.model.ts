import { Entrenado} from './entrenado.model';
import { Rutina } from './rutina.model';

export interface Entrenador{
    id: string;          
    gimnasioId: string;
    activo: boolean;
    entrenados: Entrenado[];
    rutinas: Rutina[];

}