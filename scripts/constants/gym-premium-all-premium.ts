import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";

export const gymPremiumAllPremiumConfig: SeedConfig = {
  gym: {
    id: "gym_premium_all_premium",
    nombre: "Gimnasio Premium Elite",
    email: "elite@gym.test",
    direccion: "Av. Libertador 4500",
    plan: Plan.PREMIUM
  },
  trainers: [
    {
      name: "Carlos Rodríguez Premium",
      email: "carlos.premium@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM
    },
    {
      name: "Ana Martínez Premium",
      email: "ana.premium@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM
    },
    {
      name: "Roberto Sánchez Premium",
      email: "roberto.premium@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM
    }
  ],
  trainees: [
    // 5 para Carlos (0-4)
    {
      name: "Juan Perez Premium",
      email: "juan.perez.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Maria Garcia Premium",
      email: "maria.garcia.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Luis Fernandez Premium",
      email: "luis.fernandez.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Elena Lopez Premium",
      email: "elena.lopez.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Diego Torres Premium",
      email: "diego.torres.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    // 5 para Ana (5-9)
    {
      name: "Sofia Ruiz Premium",
      email: "sofia.ruiz.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Javier Castro Premium",
      email: "javier.castro.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Lucia Morales Premium",
      email: "lucia.morales.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Andres Gil Premium",
      email: "andres.gil.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Carmen Ortiz Premium",
      email: "carmen.ortiz.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    // 5 para Roberto (10-14)
    {
      name: "Fernando Vega Premium",
      email: "fernando.vega.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Isabel Medina Premium",
      email: "isabel.medina.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE
    },
    {
      name: "Ricardo Silva Premium",
      email: "ricardo.silva.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO
    },
    {
      name: "Patricia Ramos Premium",
      email: "patricia.ramos.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO
    },
    {
      name: "Hugo Navarro Premium",
      email: "hugo.navarro.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE
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
      mutuo: true,
      gimnasioId: "gym_premium_all_premium"
    }
  ],
  // 5 ejercicios creados por Juan Perez Premium (para probar la sección "Mis Creaciones")
  traineeCreatedExercises: [
    {
      nombre: "Sentadilla Búlgara",
      descripcion: "Ejercicio unilateral para glúteos y cuádriceps, variación de Juan",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    },
    {
      nombre: "Remo con Barra T",
      descripcion: "Remo para espalda media, rutina personal de Juan",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    },
    {
      nombre: "Zancadas con Peso",
      descripcion: "Ejercicio de piernas con carga, creado por Juan para su entrenamiento",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    },
    {
      nombre: "Press Inclinado con Mancuernas",
      descripcion: "Enfoque en pecho superior, variación personal",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    },
    {
      nombre: "Curl de Bíceps con Barra Z",
      descripcion: "Aislamiento de bíceps, ejercicio propio de Juan",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    }
  ],
  // 1 rutina creada por Juan usando sus 5 ejercicios
  traineeCreatedRoutines: [
    {
      nombre: "Rutina Full Body - Mi Versión",
      creadorId: 'trainee_juanperezpremium',
      creadorNombre: 'Juan Perez Premium'
    }
  ]
};
