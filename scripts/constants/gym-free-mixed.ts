import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";

export const gymFreeMixedConfig: SeedConfig = {
  gym: {
    id: "gym_free_mixed",
    nombre: "Gimnasio del Barrio (Plan Free - Mixto)",
    email: "barrio@gym.test",
    direccion: "Av. San Martín 150",
    plan: "free"
  },
  trainers: [
    {
      name: "Juan Entrenador Premium (En Gym Free)",
      email: "juan.gymfree@gym.test",
      password: "admin123",
      plan: "premium"
    },
    {
      name: "Maria Entrenadora Free (En Gym Free)",
      email: "maria.gymfree@gym.test",
      password: "admin123",
      plan: "free"
    }
  ],
  trainees: [
    // 4 asignados a Juan (Premium)
    {
      name: "Lucas Mixto Premium",
      email: "lucas.mix.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Pedro Mixto Free",
      email: "pedro.mix.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Tomas Mixto Free",
      email: "tomas.mix.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Laura Mixto Premium",
      email: "laura.mix.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    // 4 asignados a Maria (Free)
    {
      name: "Sofia Mixto Free",
      email: "sofia.mix.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Clara Mixto Premium",
      email: "clara.mix.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Mateo Mixto Free",
      email: "mateo.mix.free@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Gabriel Mixto Premium",
      email: "gabriel.mix.prem@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    }
  ],
  // 12 ejercicios totales (respetando maxExercises: 30 de gimnasio free)
  // Juan (premium) e independientemente Maria (free) crearán subconjuntos de esta lista
  exercises: realGymExercises.slice(0, 12),
  desafios: [
    {
      id: "desafio_mix_free_1",
      creadorId: "trainee_lucasmixtopremium",
      creadorNombre: "Lucas Mixto Premium",
      titulo: "Desafío de dominadas: 20 seguidas.",
      logroRelacionado: "20 dominadas",
      disciplina: "Calistenia",
      activo: true
    }
  ],
  matches: [
    {
      id: "match-trainee_lucasmixtopremium-trainee_claramixtopremium",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_lucasmixtopremium",
      usuarioDestinoId: "trainee_claramixtopremium",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true
    }
  ]
};
