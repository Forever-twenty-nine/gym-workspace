import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";

export const gymPremiumMixedConfig: SeedConfig = {
  gym: {
    id: "gym_premium_mixed",
    nombre: "Gimnasio Fitness Center (Plan Premium - Mixto)",
    email: "center@gym.test",
    direccion: "Av. Cabildo 2200",
    plan: "premium"
  },
  trainers: [
    {
      name: "Andres Trainer Premium",
      email: "andres.trainer@gym.test",
      password: "admin123",
      plan: "premium"
    },
    {
      name: "Valeria Trainer Premium",
      email: "valeria.trainer@gym.test",
      password: "admin123",
      plan: "premium"
    },
    {
      name: "Tomas Trainer Free",
      email: "tomas.trainer@gym.test",
      password: "admin123",
      plan: "free"
    }
  ],
  trainees: [
    // 4 asignados a Andres (Trainer Premium)
    {
      name: "Martin Atleta Premium",
      email: "martin.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Carla Atleta Free",
      email: "carla.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Nicolas Atleta Free",
      email: "nicolas.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Daniela Atleta Premium",
      email: "daniela.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    // 4 asignados a Valeria (Trainer Premium)
    {
      name: "Esteban Atleta Free",
      email: "esteban.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Florencia Atleta Premium",
      email: "florencia.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Federico Atleta Free",
      email: "federico.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Marina Atleta Premium",
      email: "marina.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    // 4 asignados a Tomas (Trainer Free) - Ojo: los entrenados asignados a un entrenador Free deben respetar sus propios límites o los del gym
    {
      name: "Bautista Atleta Free",
      email: "bautista.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Rocio Atleta Free",
      email: "rocio.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Gaston Atleta Free",
      email: "gaston.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "avanzado"
    },
    {
      name: "Paula Atleta Free",
      email: "paula.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
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
      mutuo: true
    }
  ]
};
