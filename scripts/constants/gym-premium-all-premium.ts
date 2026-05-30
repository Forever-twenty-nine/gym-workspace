import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";

export const gymPremiumAllPremiumConfig: SeedConfig = {
  gym: {
    id: "gym_premium_all_premium",
    nombre: "Gimnasio Premium Elite",
    email: "elite@gym.test",
    direccion: "Av. Libertador 4500",
    plan: "premium"
  },
  trainers: [
    {
      name: "Carlos Rodríguez Premium",
      email: "carlos.premium@gym.test",
      password: "admin123",
      plan: "premium"
    },
    {
      name: "Ana Martínez Premium",
      email: "ana.premium@gym.test",
      password: "admin123",
      plan: "premium"
    },
    {
      name: "Roberto Sánchez Premium",
      email: "roberto.premium@gym.test",
      password: "admin123",
      plan: "premium"
    }
  ],
  trainees: [
    // 5 para Carlos (0-4)
    {
      name: "Juan Perez Premium",
      email: "juan.perez.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Maria Garcia Premium",
      email: "maria.garcia.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Luis Fernandez Premium",
      email: "luis.fernandez.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Elena Lopez Premium",
      email: "elena.lopez.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Diego Torres Premium",
      email: "diego.torres.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    // 5 para Ana (5-9)
    {
      name: "Sofia Ruiz Premium",
      email: "sofia.ruiz.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Javier Castro Premium",
      email: "javier.castro.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Lucia Morales Premium",
      email: "lucia.morales.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Andres Gil Premium",
      email: "andres.gil.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Carmen Ortiz Premium",
      email: "carmen.ortiz.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    // 5 para Roberto (10-14)
    {
      name: "Fernando Vega Premium",
      email: "fernando.vega.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Isabel Medina Premium",
      email: "isabel.medina.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Ricardo Silva Premium",
      email: "ricardo.silva.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Patricia Ramos Premium",
      email: "patricia.ramos.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Hugo Navarro Premium",
      email: "hugo.navarro.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    }
  ],
  // 25 ejercicios para cada entrenador (sin restricciones)
  exercises: realGymExercises,
  desafios: [
    {
      id: 'desafio_prem_1',
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium',
      titulo: 'Hoy metí 10km a ritmo fuerte, ¿quién se la banca?',
      logroRelacionado: 'Running 10k - 45:12',
      disciplina: 'Running',
      activo: true
    },
    {
      id: 'desafio_prem_2',
      creadorId: 'trainee_mariagarciapremium',
      creadorNombre: 'Maria Garcia Premium',
      titulo: 'Sentadilla 140kg x 5 reps. ¿Quién me sigue el ritmo?',
      logroRelacionado: 'Sentadilla 140kg',
      disciplina: 'Powerlifting',
      activo: true
    }
  ],
  matches: [
    {
      id: 'match-trainee_juanperezpremium-trainee_mariagarciapremium',
      tipo: 'afinidad',
      usuarioOrigenId: 'trainee_juanperezpremium',
      usuarioDestinoId: 'trainee_mariagarciapremium',
      interesOrigen: true,
      interesDestino: true,
      mutuo: true
    }
  ]
};
