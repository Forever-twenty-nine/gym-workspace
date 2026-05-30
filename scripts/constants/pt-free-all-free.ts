import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";

export const ptFreeAllFreeConfig: SeedConfig = {
  gym: {
    id: "pt_free_all_free",
    nombre: "Gimnasio - PT Carlos Free",
    email: "carlos.pt.free@gym.test",
    direccion: "Calle del Sol 400",
    plan: "free",
    isPersonalTrainer: true
  },
  trainers: [], // Vacío porque el PT actúa como el entrenador único
  trainees: [
    // Máximo 3 entrenados vinculados para respetar el límite de maxClients: 3 de entrenador free
    {
      name: "Juan Alumno Free",
      email: "juan.alumno.pt@gym.test",
      password: "user123",
      plan: "free",
      nivel: "principiante"
    },
    {
      name: "Maria Alumna Free",
      email: "maria.alumna.pt@gym.test",
      password: "user123",
      plan: "free",
      nivel: "intermedio"
    },
    {
      name: "Luis Alumno Free",
      email: "luis.alumno.pt@gym.test",
      password: "user123",
      plan: "free",
      nivel: "avanzado"
    }
  ],
  // 10 ejercicios creados por el PT para respetar maxExercises: 10 de entrenador free
  exercises: realGymExercises.slice(0, 10),
  desafios: [
    {
      id: "pt_desafio_free_1",
      creadorId: "trainee_juanalumnofree",
      creadorNombre: "Juan Alumno Free",
      titulo: "¡10 flexiones de brazos seguidas hoy!",
      logroRelacionado: "10 flexiones",
      disciplina: "Calistenia",
      activo: true
    }
  ],
  matches: [
    {
      id: "match-trainee_juanalumnofree-trainee_mariaalumnafree",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_juanalumnofree",
      usuarioDestinoId: "trainee_mariaalumnafree",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true
    }
  ]
};
