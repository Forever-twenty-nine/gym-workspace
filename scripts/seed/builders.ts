import { Timestamp } from "firebase-admin/firestore";
import type { User } from "../../projects/gym-library/src/lib/models/user.model";
import type { Entrenador } from "../../projects/gym-library/src/lib/models/entrenador.model";
import type { Entrenado } from "../../projects/gym-library/src/lib/models/entrenado.model";
import type { Gimnasio } from "../../projects/gym-library/src/lib/models/gimnasio.model";
import type { Ejercicio } from "../../projects/gym-library/src/lib/models/ejercicio.model";
import type { Rutina } from "../../projects/gym-library/src/lib/models/rutina.model";
import type { RutinaAsignada } from "../../projects/gym-library/src/lib/models/rutina-asignada.model";
import type { SesionRutina } from "../../projects/gym-library/src/lib/models/sesion-rutina.model";
import type { Desafio } from "../../projects/gym-library/src/lib/models/desafio.model";
import type { Convocatoria } from "../../projects/gym-library/src/lib/models/convocatoria.model";
import type { MatchInteraction } from "../../projects/gym-library/src/lib/models/match-interaction.model";
import type { Mensaje } from "../../projects/gym-library/src/lib/models/mensaje.model";
import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { NivelEntrenamiento } from "../../projects/gym-library/src/lib/enums/nivel-entrenamiento.enum";
import { Rol } from "../../projects/gym-library/src/lib/enums/rol.enum";

/**
 * Pure builders for seed data.
 * These are typed against the gym-library models so that if a model changes
 * (new required field, rename, type change), both the seed implementation
 * AND the conformance tests will fail at compile / test time.
 *
 * Date fields are returned as JS Date here (domain view). The DB layer
 * converts to Firestore Timestamp when writing.
 */

export interface TrainerSeedInput {
  uid: string;
  nombre: string;
  email: string;
  plan: Plan;
  photoURL?: string;
}

export interface TraineeSeedInput {
  uid: string;
  nombre: string;
  email: string;
  plan: Plan;
  nivel: NivelEntrenamiento;
  objetivo?: Objetivo;
  bio?: string;
  franjaHoraria?: { inicio: string; fin: string };
  trainerUid?: string;
  photoURL?: string;
}

export interface GymSeedInput {
  id: string;
  nombre: string;
  email: string;
  direccion: string;
  plan: Plan;
  isPersonalTrainer?: boolean;
  photoURL?: string;
}

export function buildTrainerUser(uid: string, nombre: string, email: string, plan: Plan, photoURL?: string): User & { fechaCreacion?: any; fechaRegistro?: any } {
  return {
    uid,
    nombre,
    email,
    role: Rol.ENTRENADOR,
    plan: plan as any,
    onboarded: true,
    photoURL: photoURL,
    fechaCreacion: new Date(),
    fechaRegistro: new Date(),
  };
}

export function buildEntrenadorDoc(id: string, overrides: Partial<Entrenador> = {}): Entrenador {
  return {
    id,
    fechaRegistro: new Date(),
    ejerciciosCreadasIds: [],
    rutinasCreadasIds: [],
    entrenadosAsignadosIds: [],
    entrenadosPremiumIds: [],
    ...overrides,
  };
}

export function buildTraineeUser(input: TraineeSeedInput): User & Record<string, unknown> {
  return {
    uid: input.uid,
    nombre: input.nombre,
    email: input.email,
    role: Rol.ENTRENADO,
    plan: input.plan,
    onboarded: true,
    objetivo: input.objetivo,
    fechaCreacion: new Date(),
    bio: input.bio,
    franjaHoraria: input.franjaHoraria,
    nivel: input.nivel as any,
    seguidores: [],
    seguidos: [],
    visibleDescubrir: true,
    photoURL: input.photoURL,
  };
}

export function buildEntrenadoDoc(input: TraineeSeedInput): Entrenado & Record<string, unknown> {
  return {
    id: input.uid,
    objetivo: input.objetivo,
    entrenadoresId: input.trainerUid ? [input.trainerUid] : [],
    rutinasAsignadasIds: [],
    fechaRegistro: new Date(),
    plan: input.plan as any,
    bio: input.bio,
    franjaHoraria: input.franjaHoraria,
    nivel: input.nivel as any,
    seguidores: [],
    seguidos: [],
    visibleDescubrir: true,
    photoURL: input.photoURL,
  };
}

export function buildGymDoc(input: GymSeedInput, trainersIds: string[], traineesIds: string[]): Gimnasio & Record<string, unknown> {
  const isPT = !!input.isPersonalTrainer;
  return {
    id: input.id,
    nombre: input.nombre,
    direccion: input.direccion,
    activo: true,
    isPersonalTrainer: isPT,
    plan: input.plan as any,
    entrenadoresIds: isPT ? [input.id] : trainersIds,
    entrenadosIds: traineesIds,
    ...(input.photoURL ? { photoURL: input.photoURL } : {}),
  };
}

export function buildGymUser(input: GymSeedInput): User & Record<string, unknown> {
  const isPT = !!input.isPersonalTrainer;
  return {
    uid: input.id,
    nombre: input.nombre,
    email: input.email,
    role: isPT ? Rol.PERSONAL_TRAINER : Rol.GIMNASIO,
    onboarded: true,
    plan: input.plan as any,
    fechaCreacion: new Date(),
    ...(input.photoURL ? { photoURL: input.photoURL } : {}),
  };
}

export function buildEjercicio(id: string, nombre: string, descripcion: string, creadorId?: string): Ejercicio & Record<string, unknown> {
  return {
    id,
    nombre,
    descripcion,
    series: 3,
    repeticiones: 10,
    peso: 20,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
    ...(creadorId ? { creadorId } : {}),
  };
}

export function buildRutina(
  id: string,
  nombre: string,
  ejerciciosIds: string[],
  usuarioId: string,
  nombreUsuario: string,
  creadorId?: string
): Rutina & Record<string, unknown> {
  return {
    id,
    nombre,
    activa: true,
    descripcion: `Rutina ${nombre}`,
    ejerciciosIds,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
    usuarioId,
    nombreUsuario,
    ...(creadorId ? { creadorId } : {}),
  };
}

export function buildRutinaAsignada(
  id: string,
  rutinaId: string,
  entrenadoId: string,
  entrenadorId: string,
  diaSemana: string
): RutinaAsignada {
  return {
    id,
    rutinaId,
    entrenadoId,
    entrenadorId,
    diaSemana,
    fechaAsignacion: new Date(),
    activa: true,
  };
}

export function buildSesionRutinaMock(
  id: string,
  entrenadoId: string,
  nombreUsuario: string,
  rutinaId: string,
  rutinaNombre: string
): SesionRutina & Record<string, unknown> {
  const now = Date.now();
  return {
    id,
    entrenadoId,
    fechaInicio: new Date(now - 3600000 * 2),
    fechaFin: new Date(now - 3600000),
    duracion: 3600,
    status: "completada" as any,
    completada: true,
    compartida: true,
    nombreUsuario,
    fotoUsuario: undefined,
    fechaCompartida: new Date(),
    likes: [],
    rutinaResumen: { id: rutinaId, nombre: rutinaNombre, ejercicios: [] },
  };
}

export function buildDesafio(input: {
  id: string;
  creadorId: string;
  creadorNombre: string;
  titulo: string;
  logroRelacionado?: string;
  disciplina?: string;
  activo: boolean;
  gimnasioId: string;
}): Desafio & Record<string, unknown> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  return {
    id: input.id,
    creadorId: input.creadorId,
    creadorNombre: input.creadorNombre,
    creadorFoto: undefined,
    gimnasioId: input.gimnasioId,
    titulo: input.titulo,
    logroRelacionado: input.logroRelacionado,
    disciplina: input.disciplina,
    fechaCreacion: now,
    fechaVencimiento: in7Days,
    activo: input.activo,
  };
}

export function buildConvocatoria(input: {
  id: string;
  creadorId: string;
  creadorNombre: string;
  creadorFoto?: string | null;
  gimnasioId: string;
  fechaEntrenamiento: Date;
  horaInicio: string;
  horaFin: string;
  mensaje?: string;
  interesados?: string[];
  activo: boolean;
  creadorRol?: string;
  titulo?: string;
  esOficial?: boolean;
}): Convocatoria & Record<string, unknown> {
  return {
    id: input.id,
    creadorId: input.creadorId,
    creadorNombre: input.creadorNombre,
    creadorFoto: input.creadorFoto,
    gimnasioId: input.gimnasioId,
    fechaCreacion: new Date(),
    fechaEntrenamiento: input.fechaEntrenamiento,
    horaInicio: input.horaInicio,
    horaFin: input.horaFin,
    mensaje: input.mensaje,
    interesados: input.interesados ?? [],
    activo: input.activo,
    creadorRol: (input.creadorRol || 'entrenado') as any,
    ...(input.titulo ? { titulo: input.titulo } : {}),
    ...(input.esOficial !== undefined ? { esOficial: input.esOficial } : {}),
  };
}

export function buildMatch(input: {
  id: string;
  tipo: "afinidad" | "horario";
  usuarioOrigenId: string;
  usuarioDestinoId: string;
  interesOrigen: boolean;
  interesDestino: boolean;
  mutuo: boolean;
  gimnasioId?: string;
}): MatchInteraction & Record<string, unknown> {
  const now = new Date();
  return {
    id: input.id,
    tipo: input.tipo as any,
    usuarioOrigenId: input.usuarioOrigenId,
    usuarioDestinoId: input.usuarioDestinoId,
    interesOrigen: input.interesOrigen,
    interesDestino: input.interesDestino,
    mutuo: input.mutuo,
    fechaCreacion: now,
    fechaMatch: input.mutuo ? now : undefined,
    ...(input.gimnasioId ? { gimnasioId: input.gimnasioId } : {}),
  };
}

export function buildMensaje(input: {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  contenido: string;
  leido?: boolean;
}): Mensaje & Record<string, unknown> {
  return {
    id: input.id,
    remitenteId: input.remitenteId,
    remitenteTipo: Rol.ENTRENADO,
    destinatarioId: input.destinatarioId,
    destinatarioTipo: Rol.ENTRENADO,
    contenido: input.contenido,
    tipo: "TEXTO" as any,
    leido: !!input.leido,
    entregado: true,
    fechaEnvio: new Date(),
  };
}

/**
 * Helper to convert a builder result (with Date) to a Firestore-writable object
 * (replacing Date with Timestamp for known date fields).
 */
export function toFirestoreWrite(data: any): any {
  const out: any = { ...data };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val === undefined) {
      delete out[key];
      continue;
    }
    if (val instanceof Date) {
      out[key] = Timestamp.fromDate(val);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      // shallow for now (rutinaResumen etc. rarely have nested Dates in seed)
    }
  }
  return out;
}
