import { Rol} from '../enums/rol.enum';
import { Plan } from '../enums/plan.enum';
/**
 * Usuario de firebase 
 */

export interface User {
  uid: string;
  nombre?: string;
  email?: string;
  emailVerified?: boolean;
  role?: Rol;
  entrenadorId?: string;
  gimnasioId?: string;
  clienteId?: string;
  onboarded?: boolean;
  plan?: Plan;
}
