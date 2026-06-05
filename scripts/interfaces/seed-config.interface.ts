import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";

export interface GymConfig {
  id: string;
  nombre: string;
  email: string;
  direccion: string;
  plan: Plan;
  isPersonalTrainer?: boolean;
}

export interface TrainerConfig {
  name: string;
  email: string;
  password?: string;
  plan: Plan;
}

export interface TraineeConfig {
  name: string;
  email: string;
  password?: string;
  plan: Plan;
  nivel: NivelEntrenamiento;
}

export interface DesafioConfig {
  id: string;
  creadorId: string;
  creadorNombre: string;
  titulo: string;
  logroRelacionado: string;
  disciplina: string;
  activo: boolean;
}

export interface MatchConfig {
  id: string;
  tipo: 'afinidad' | 'horario';
  usuarioOrigenId: string;
  usuarioDestinoId: string;
  interesOrigen: boolean;
  interesDestino: boolean;
  mutuo: boolean;
}

export interface SeedConfig {
  gym: GymConfig;
  trainers: TrainerConfig[];
  trainees: TraineeConfig[];
  exercises: string[];
  desafios: DesafioConfig[];
  matches: MatchConfig[];
}
export { Objetivo, Plan, NivelEntrenamiento };
