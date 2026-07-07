import { Plan } from 'gym-library';

declare module 'gym-library' {
  export interface Entrenador {
    fechaRegistro?: Date;
    entrenadosPremiumIds?: string[];
  }
  export interface Entrenado {
    fechaRegistro?: Date;
  }
  export interface Gimnasio {
    nombre?: string;
    activo?: boolean;
    plan?: Plan | string;
  }
}
