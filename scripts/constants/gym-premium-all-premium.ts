import { SeedConfig } from "../interfaces/seed-config.interface";
import { realGymExercises } from "./common-mocks";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";

/**
 * Gimnasio Premium Elite – Plan premium
 * - 2 entrenadores
 * - 3 entrenados por entrenador (6 en total)
 * - 9 ejercicios por entrenador (slice de realGymExercises)
 * - 2 matches entre entrenados
 */
export const gymPremiumAllPremiumConfig: SeedConfig = {
  gym: {
    id: "gym_premium_all_premium",
    nombre: "Gimnasio Premium Elite",
    email: "elite@gym.test",
    direccion: "Av. Libertador 4500",
    plan: Plan.PREMIUM,
  },
  trainers: [
    {
      name: "Carlos Rodriguez Premium",
      email: "carlos.premium@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM,
    },
    {
      name: "Ana Martinez Premium",
      email: "ana.premium@gym.test",
      password: "admin123",
      plan: Plan.PREMIUM,
    },
  ],
  trainees: [
    // ─── 3 entrenados de Carlos (índices 0, 2, 4 → trainer[0]) ───
    {
      name: "Juan Perez Premium",
      email: "juan.perez.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO,
    },
    {
      name: "Maria Garcia Premium",
      email: "maria.garcia.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO,
    },
    {
      name: "Luis Fernandez Premium",
      email: "luis.fernandez.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE,
    },
    // ─── 3 entrenados de Ana (índices 1, 3, 5 → trainer[1]) ───
    {
      name: "Sofia Ruiz Premium",
      email: "sofia.ruiz.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.PRINCIPIANTE,
    },
    {
      name: "Javier Castro Premium",
      email: "javier.castro.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.INTERMEDIO,
    },
    {
      name: "Lucia Morales Premium",
      email: "lucia.morales.prem@gym.test",
      password: "user123",
      plan: Plan.PREMIUM,
      nivel: NivelEntrenamiento.AVANZADO,
    },
  ],
  // 9 ejercicios (tomados del pool general)
  exercises: realGymExercises.slice(0, 9),
  desafios: [], // los desafíos se generan dinámicamente en seedDesafios (1 por entrenado)
  matches: [
    {
      id: "match-prem-juan-maria",
      tipo: "afinidad",
      usuarioOrigenId: "trainee_juanperezpremium",
      usuarioDestinoId: "trainee_mariagarciapremium",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
      gimnasioId: "gym_premium_all_premium",
    },
    {
      id: "match-prem-sofia-javier",
      tipo: "horario",
      usuarioOrigenId: "trainee_sofiaruizpremium",
      usuarioDestinoId: "trainee_javiercastropremium",
      interesOrigen: true,
      interesDestino: true,
      mutuo: true,
      gimnasioId: "gym_premium_all_premium",
    },
  ],
  // Ejercicios y rutinas creadas por Juan Perez Premium (feature premium)
  traineeCreatedExercises: [
    {
      nombre: "Sentadilla Búlgara",
      descripcion: "Ejercicio unilateral para glúteos y cuádriceps, variación de Juan",
      creadorId: "trainee_juanperezpremium",
      creadorNombre: "Juan Perez Premium",
    },
    {
      nombre: "Remo con Barra T",
      descripcion: "Remo para espalda media, rutina personal de Juan",
      creadorId: "trainee_juanperezpremium",
      creadorNombre: "Juan Perez Premium",
    },
    {
      nombre: "Zancadas con Peso",
      descripcion: "Ejercicio de piernas con carga, creado por Juan",
      creadorId: "trainee_juanperezpremium",
      creadorNombre: "Juan Perez Premium",
    },
  ],
  traineeCreatedRoutines: [
    {
      nombre: "Rutina Full Body - Mi Versión",
      creadorId: "trainee_juanperezpremium",
      creadorNombre: "Juan Perez Premium",
    },
  ],
};
