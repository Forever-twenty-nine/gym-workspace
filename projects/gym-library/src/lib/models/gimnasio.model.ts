/**
 * Contiene los datos específicos del gimnasio.
 */
import { Plan } from '../enums/plan.enum';

export interface Gimnasio {
  id: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  plan?: Plan;
  isPersonalTrainer?: boolean;
  entrenadoresIds?: string[];
  entrenadosIds?: string[];
}