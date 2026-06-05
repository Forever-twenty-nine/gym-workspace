import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";

export const gymFreeAllFreeConfig: SeedConfig = {
  gym: {
    id: "gym_free_all_free",
    nombre: "Gimnasio Comunitario (Plan Free)",
    email: "comunitario@gym.test",
    direccion: "Calle Falsa 123",
    plan: Plan.FREE
  },
  trainers: [
    {
      name: "Juan Entrenador Free",
      email: "juan.free@gym.test",
      password: "admin123",
      plan: Plan.FREE
    },
    {
      name: "Maria Entrenadora Free",
      email: "maria.free@gym.test",
      password: "admin123",
      plan: Plan.FREE
    }
  ],
  trainees: [
    // 3 para Juan Entrenador Free (Trainees 0, 1, 2)
    {
      name: "Lucas Principiante",
      email: "lucas.principiante@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Pedro Intermedio",
      email: "pedro.intermedio@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Tomas Avanzado",
      email: "tomas.avanzado@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.AVANZADO
    },
    // 3 para Maria Entrenadora Free (Trainees 3, 4, 5)
    {
      name: "Sofia Principiante",
      email: "sofia.principiante@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Clara Intermedio",
      email: "clara.intermedio@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Mateo Avanzado",
      email: "mateo.avanzado@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.AVANZADO
    }
  ],
  // 10 ejercicios reales de la lista común para respetar el límite de maxExercises: 10 para entrenador free
  // Y maxExercises: 30 para gimnasio free (en total usaremos estos 10 para cada uno)
  exercises: realGymExercises.slice(0, 10),
  desafios: [
    {
      id: "desafio_free_1",
      creadorId: "trainee_lucasprincipiante",
      creadorNombre: "Lucas Principiante",
      titulo: "¡Primer día completado! 30 minutos de cinta sin parar.",
      logroRelacionado: "Cinta 30 min",
      disciplina: "Running",
      activo: true
    },
    {
      id: "desafio_free_2",
      creadorId: "trainee_mateoavanzado",
      creadorNombre: "Mateo Avanzado",
      titulo: "Reto de peso muerto: 150kg x 3 reps. ¿Quién se suma?",
      logroRelacionado: "Peso Muerto 150kg",
      disciplina: "Powerlifting",
      activo: true
    }
  ],
  matches: [
    {
      id: "match-trainee_lucasprincipiante-trainee_pedrointermedio",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_lucasprincipiante",
      usuarioDestinoId: "trainee_pedrointermedio",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true
    }
  ]
};
