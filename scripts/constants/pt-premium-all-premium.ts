import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";

export const ptPremiumAllPremiumConfig: SeedConfig = {
  gym: {
    id: "pt_premium_all_premium",
    nombre: "Gimnasio - PT Valeria Premium",
    email: "valeria.pt.prem@gym.test",
    direccion: "Av. Del Libertador 8000",
    plan: "premium",
    isPersonalTrainer: true
  },
  trainers: [], // Vacío porque el PT Valeria actúa como la entrenadora única
  trainees: [
    {
      name: "Martin Alumno Premium",
      email: "martin.alumno.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Carla Alumna Premium",
      email: "carla.alumna.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Nicolas Alumno Premium",
      email: "nicolas.alumno.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Daniela Alumna Premium",
      email: "daniela.alumna.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Esteban Alumno Premium",
      email: "esteban.alumno.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "principiante"
    },
    {
      name: "Florencia Alumna Premium",
      email: "florencia.alumna.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "avanzado"
    },
    {
      name: "Federico Alumno Premium",
      email: "federico.alumno.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    },
    {
      name: "Marina Alumna Premium",
      email: "marina.alumna.pt@gym.test",
      password: "user123",
      plan: "premium",
      nivel: "intermedio"
    }
  ],
  exercises: realGymExercises, // Todos los ejercicios
  desafios: [
    {
      id: "pt_desafio_prem_1",
      creadorId: "trainee_martinalumnopremium",
      creadorNombre: "Martin Alumno Premium",
      titulo: "Reto burpees: 50 en 2 minutos.",
      logroRelacionado: "50 burpees",
      disciplina: "Crossfit",
      activo: true
    }
  ],
  matches: [
    {
      id: "match-trainee_martinalumnopremium-trainee_florenciaalumnapremium",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_martinalumnopremium",
      usuarioDestinoId: "trainee_florenciaalumnapremium",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true
    }
  ]
};
