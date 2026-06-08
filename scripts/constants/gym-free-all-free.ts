import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";

/**
 * Gimnasio Free – Plan gratuito
 * - 2 entrenadores
 * - 3 entrenados por entrenador (6 en total)
 * - 9 ejercicios por entrenador (slice de realGymExercises)
 * - 2 matches entre entrenados
 */
export const gymFreeAllFreeConfig: SeedConfig = {
  gym: {
    id: "gym_free_all_free",
    nombre: "Gimnasio Comunitario (Plan Free)",
    email: "comunitario@gym.test",
    direccion: "Calle Falsa 123",
    plan: Plan.FREE,
  },
  trainers: [
    {
      name: "Juan Entrenador Free",
      email: "juan.free@gym.test",
      password: "admin123",
      plan: Plan.FREE,
    },
    {
      name: "Maria Entrenadora Free",
      email: "maria.free@gym.test",
      password: "admin123",
      plan: Plan.FREE,
    },
  ],
  trainees: [
    // ─── 3 entrenados de Juan (índices 0, 2, 4 → trainer[0]) ───
    {
      name: "Lucas Principiante",
      email: "lucas.principiante@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE,
    },
    {
      name: "Pedro Intermedio",
      email: "pedro.intermedio@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO,
    },
    {
      name: "Tomas Avanzado",
      email: "tomas.avanzado@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.AVANZADO,
    },
    // ─── 3 entrenados de Maria (índices 1, 3, 5 → trainer[1]) ───
    {
      name: "Sofia Principiante",
      email: "sofia.principiante@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE,
    },
    {
      name: "Clara Intermedio",
      email: "clara.intermedio@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO,
    },
    {
      name: "Mateo Avanzado",
      email: "mateo.avanzado@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.AVANZADO,
    },
  ],
  // 9 ejercicios (respeta el límite free de entrenadores)
  exercises: realGymExercises.slice(0, 9),
  desafios: [], // los desafíos se generan dinámicamente en seedDesafios (1 por entrenado)
  matches: [
    {
      id: "match-free-lucas-pedro",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_lucasprincipiante",
      usuarioDestinoId: "trainee_pedrointermedio",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
      gimnasioId: "gym_free_all_free",
    },
    {
      id: "match-free-sofia-mateo",
      tipo: "horario",
      usuarioOrigenId: "trainee_sofiaprincipiante",
      usuarioDestinoId: "trainee_mateoavanzado",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
      gimnasioId: "gym_free_all_free",
    },
  ],
};
