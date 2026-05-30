import { Rol } from '../enums/rol.enum';
import { Plan } from '../enums/plan.enum';

export interface PlanLimits {
  maxClients: number;      // Cantidad máxima de clientes activos vinculados
  maxRoutines: number;     // Cantidad máxima de rutinas creadas
  maxExercises: number;    // Cantidad máxima de ejercicios creados
  allowCustomTimers: boolean;   // Permite configurar tiempos de descanso/serie en ejercicios
  allowCustomDuration: boolean; // Permite configurar duración personalizada en rutinas
}

export const ROL_PLAN_LIMITS: Record<Rol, Record<Plan, PlanLimits>> = {
  [Rol.ENTRENADOR]: {
    [Plan.FREE]: {
      maxClients: 3,
      maxRoutines: 3,
      maxExercises: 10,
      allowCustomTimers: false,
      allowCustomDuration: false
    },
    [Plan.PREMIUM]: {
      maxClients: Infinity,
      maxRoutines: Infinity,
      maxExercises: Infinity,
      allowCustomTimers: true,
      allowCustomDuration: true
    }
  },
  [Rol.PERSONAL_TRAINER]: {
    [Plan.FREE]: {
      maxClients: 3,
      maxRoutines: 3,
      maxExercises: 10,
      allowCustomTimers: false,
      allowCustomDuration: false
    },
    [Plan.PREMIUM]: {
      maxClients: Infinity,
      maxRoutines: Infinity,
      maxExercises: Infinity,
      allowCustomTimers: true,
      allowCustomDuration: true
    }
  },
  [Rol.GIMNASIO]: {
    [Plan.FREE]: {
      maxClients: 20,
      maxRoutines: 10,
      maxExercises: 30,
      allowCustomTimers: true,
      allowCustomDuration: true
    },
    [Plan.PREMIUM]: {
      maxClients: Infinity,
      maxRoutines: Infinity,
      maxExercises: Infinity,
      allowCustomTimers: true,
      allowCustomDuration: true
    }
  },
  [Rol.ENTRENADO]: {
    [Plan.FREE]: {
      maxClients: 1,
      maxRoutines: 1,
      maxExercises: 5,
      allowCustomTimers: false,
      allowCustomDuration: false
    },
    [Plan.PREMIUM]: {
      maxClients: Infinity,
      maxRoutines: Infinity,
      maxExercises: Infinity,
      allowCustomTimers: true,
      allowCustomDuration: true
    }
  }
};
