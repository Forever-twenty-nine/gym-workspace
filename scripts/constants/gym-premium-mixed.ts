import { SeedConfig } from "../interfaces/seed-config.interface";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";
import { realGymExercises } from "./common-mocks";

export const gymPremiumMixedConfig: SeedConfig = {
  gym: {
    id: "gym_premium_mixed",
    nombre: "Gimnasio Fitness Center (Plan Premium - Mixto)",
    email: "center@gym.test",
    direccion: "Av. Cabildo 2200",
    plan: Plan.PREMIUM
  },
  trainers: [
    {
      name: "Andres Trainer Premium",
      email: "andres.trainer@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM
    },
    {
      name: "Valeria Trainer Premium",
      email: "valeria.trainer@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM
    },
    {
      name: "Tomas Trainer Free",
      email: "tomas.trainer@gym.test",
      password: "admin123",
      plan: Plan.FREE
    }
  ],
  trainees: [
    // 4 asignados a Andres (Trainer Premium)
    {
      name: "Martin Atleta Premium",
      email: "martin.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Carla Atleta Free",
      email: "carla.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Nicolas Atleta Free",
      email: "nicolas.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Daniela Atleta Premium",
      email: "daniela.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    // 4 asignados a Valeria (Trainer Premium)
    {
      name: "Esteban Atleta Free",
      email: "esteban.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Florencia Atleta Premium",
      email: "florencia.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Federico Atleta Free",
      email: "federico.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Marina Atleta Premium",
      email: "marina.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    // 4 asignados a Tomas (Trainer Free) - Ojo: los entrenados asignados a un entrenador Free deben respetar sus propios límites o los del gym
    {
      name: "Bautista Atleta Free",
      email: "bautista.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Rocio Atleta Free",
      email: "rocio.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Gaston Atleta Free",
      email: "gaston.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Paula Atleta Free",
      email: "paula.free@gym.test",
      password: "user123",
      plan: Plan.FREE,
      nivel: NivelEntrenamiento.INTERMEDIO
    }
  ],
  exercises: realGymExercises,
  desafios: [
    {
      id: "desafio_prem_mix_1",
      creadorId: "trainee_martinatletapremium",
      creadorNombre: "Martin Atleta Premium",
      titulo: "Reto funcional: 100 burpees en menos de 5 minutos.",
      logroRelacionado: "100 burpees",
      disciplina: "Crossfit",
      activo: true
    }
  ],
  matches: [
    {
      id: "match-trainee_martinatletapremium-trainee_florenciaatletapremium",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_martinatletapremium",
      usuarioDestinoId: "trainee_florenciaatletapremium",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
      gimnasioId: "gym_premium_mixed"
    }
  ]
};
