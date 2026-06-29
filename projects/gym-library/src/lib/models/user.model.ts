import { Rol } from '../enums/rol.enum';
import { Plan } from '../enums/plan.enum';

export interface User {
  uid: string;
  // Profile header
  nombre?: string;
  email?: string;
  emailVerified?: boolean;
  // Campos de perfil
  plan?: Plan;
  photoURL?: string | null;
  mensajesGlobalesLeidos?: string[];
  // Asociaciones
  role?: Rol;
  entrenadorId?: string;
  gimnasioId?: string;
  entrenadoId?: string;
  onboarded?: boolean;
  // Fechas
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}
