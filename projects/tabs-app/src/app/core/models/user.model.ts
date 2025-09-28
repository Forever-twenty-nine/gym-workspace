import { Rol} from '../enums/rol.enum';
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
  onboarded?: boolean;
}
