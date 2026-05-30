import { DesafioConfig, MatchConfig } from "../interfaces/seed-config.interface";

export const mockBios = [
  "Foco en powerlifting y ganancia de fuerza. Entreno con metal a tope.",
  "Buscando cambiar hábitos y comer más sano. ¡Running y funcional!",
  "Crossfit addict. Entrenando para mi próxima competencia de box.",
  "Calistenia y control corporal. Entreno temprano por la mañana.",
  "Definición y musculación. Consistencia antes que intensidad."
];

export const mockTags = [
  ["EntrenaConMetal", "FuerzaMax", "Fierrero"],
  ["NutricionKeto", "VidaSana", "Cardio"],
  ["Crossfit", "Comunidad", "Superacion"],
  ["Calistenia", "StreetWorkout", "Salud"],
  ["ObjetivoDefinicion", "GymBro", "Musculacion"]
];

export const mockDisciplinas = [
  ["Powerlifting", "Musculación"],
  ["Running", "Musculación"],
  ["Crossfit"],
  ["Calistenia"],
  ["Musculación"]
];

export const mockFranjas = [
  { inicio: "19:00", fin: "21:00" },
  { inicio: "18:30", fin: "20:30" },
  { inicio: "07:00", fin: "09:00" },
  { inicio: "08:00", fin: "10:00" },
  { inicio: "20:00", fin: "22:00" }
];

export const realGymExercises = [
  "Sentadilla con Barra", "Press de Banca", "Peso Muerto", "Dominadas", "Press Militar",
  "Curl de Bíceps con Mancuerna", "Tríceps en Polea Alta", "Zancadas", "Remo con Barra", "Prensa de Piernas",
  "Elevaciones Laterales", "Press Inclinado", "Fondos de Pecho", "Copa de Tríceps", "Curl Martillo",
  "Extensión de Cuádriceps", "Curl Femoral", "Elevación de Talones", "Plancha Abdominal", "Abdominales en Polea",
  "Aperturas con Mancuerna", "Face Pull", "Remo al Mentón", "Hip Thrust", "Pajaros/Elevación Posterior"
];

export const defaultDesafios: DesafioConfig[] = [
  {
    id: 'desafio_1',
    creadorId: 'trainee_juanperez',
    creadorNombre: 'Juan Pérez',
    titulo: 'Hoy metí 5km en 22 min, ¿quién se la banca?',
    logroRelacionado: 'Running 5k - 22:15',
    disciplina: 'Running',
    activo: true
  },
  {
    id: 'desafio_2',
    creadorId: 'trainee_mariagarcia',
    creadorNombre: 'María García',
    titulo: 'Sentadilla 120kg x 5 reps. ¿Quién me sigue el ritmo de piernas?',
    logroRelacionado: 'Sentadilla 120kg',
    disciplina: 'Powerlifting',
    activo: true
  },
  {
    id: 'desafio_3',
    creadorId: 'trainee_luisfernandez',
    creadorNombre: 'Luis Fernández',
    titulo: 'Reto de flexiones de brazos: 50 en un minuto.',
    logroRelacionado: '50 flexiones',
    disciplina: 'Calistenia',
    activo: true
  }
];

export const defaultMatches: MatchConfig[] = [
  {
    id: 'match-trainee_juanperez-trainee_mariagarcia',
    tipo: 'afinidad',
    usuarioOrigenId: 'trainee_juanperez',
    usuarioDestinoId: 'trainee_mariagarcia',
    interesOrigen: true,
    interesDestino: true,
    mutuo: true
  },
  {
    id: 'match-trainee_mariagarcia-trainee_luisfernandez',
    tipo: 'horario',
    usuarioOrigenId: 'trainee_mariagarcia',
    usuarioDestinoId: 'trainee_luisfernandez',
    interesOrigen: true,
    interesDestino: false,
    mutuo: false
  }
];
