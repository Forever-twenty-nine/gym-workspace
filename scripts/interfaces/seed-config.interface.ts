import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";

export interface GymConfig {
  id: string;
  nombre: string;
  email: string;
  direccion: string;
  plan: 'free' | 'premium';
  isPersonalTrainer?: boolean;
}

export interface TrainerConfig {
  name: string;
  email: string;
  password?: string;
  plan: 'free' | 'premium';
}

export interface TraineeConfig {
  name: string;
  email: string;
  password?: string;
  plan: 'free' | 'premium';
  nivel: 'principiante' | 'intermedio' | 'avanzado';
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
export { Objetivo };
