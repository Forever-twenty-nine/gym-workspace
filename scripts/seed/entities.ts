import { Auth } from "firebase-admin/auth";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";
import {
  GymConfig,
  TraineeConfig,
  TrainerConfig,
} from "../interfaces/seed-config.interface";
import { mockBios, mockFranjas } from "../constants/common-mocks";
import { ensureAuthUser } from "./auth";
import { stats } from "./context";
import { resolveProfilePhoto } from "./storage";
import { toSeedUid } from "./uid";

export async function createTrainer(db: Firestore, auth: Auth, trainerConfig: TrainerConfig) {
  const uid = toSeedUid("trainer", trainerConfig.name);
  const photoURL = await resolveProfilePhoto(uid, trainerConfig.name, "entrenador", trainerConfig.plan);

  const trainerUserData = {
    uid,
    nombre: trainerConfig.name,
    email: trainerConfig.email,
    role: "entrenador",
    plan: trainerConfig.plan,
    onboarded: true,
    photoURL,
    fechaCreacion: Timestamp.now(),
    fechaRegistro: Timestamp.now(),
  };

  await Promise.all([
    db.collection("usuarios").doc(uid).set(trainerUserData, { merge: true }),
    ensureAuthUser(
      auth,
      uid,
      trainerConfig.email,
      trainerConfig.password || "changeme123",
      trainerConfig.name,
      undefined,
      photoURL
    ),
    db.collection("entrenadores").doc(uid).set(
      {
        id: uid,
        fechaRegistro: Timestamp.now(),
        ejerciciosCreadasIds: [],
        rutinasCreadasIds: [],
        entrenadosAsignadosIds: [],
        entrenadosPremiumIds: [],
      },
      { merge: true }
    ),
  ]);

  stats.trainersCreated++;
  return { ...trainerUserData };
}

export async function createTrainee(
  db: Firestore,
  auth: Auth,
  traineeConfig: TraineeConfig,
  trainerUid: string,
  index: number
) {
  const uid = toSeedUid("trainee", traineeConfig.name);

  const objetivos = [Objetivo.VOLUMEN, Objetivo.DEFINICION, Objetivo.FUERZA, Objetivo.SALUD];
  const objetivoAleatorio = objetivos[index % objetivos.length];
  const bio = mockBios[index % mockBios.length];
  const franjaHoraria = mockFranjas[index % mockFranjas.length];
  const photoURL = await resolveProfilePhoto(uid, traineeConfig.name, "entrenado", traineeConfig.plan);

  const traineeUserData = {
    uid,
    nombre: traineeConfig.name,
    email: traineeConfig.email,
    role: "entrenado",
    plan: traineeConfig.plan,
    onboarded: true,
    objetivo: objetivoAleatorio,
    fechaCreacion: Timestamp.now(),
    bio,
    franjaHoraria,
    nivel: traineeConfig.nivel,
    seguidores: [],
    seguidos: [],
    visibleDescubrir: true,
    photoURL,
  };

  await Promise.all([
    db.collection("usuarios").doc(uid).set(traineeUserData, { merge: true }),
    ensureAuthUser(
      auth,
      uid,
      traineeConfig.email,
      traineeConfig.password || "user123",
      traineeConfig.name,
      undefined,
      photoURL
    ),
    db.collection("entrenados").doc(uid).set(
      {
        id: uid,
        objetivo: objetivoAleatorio,
        entrenadoresId: [trainerUid],
        rutinasAsignadasIds: [],
        fechaRegistro: Timestamp.now(),
        plan: traineeConfig.plan,
        bio,
        franjaHoraria,
        nivel: traineeConfig.nivel,
        seguidores: [],
        seguidos: [],
        visibleDescubrir: true,
        photoURL,
      },
      { merge: true }
    ),
  ]);

  stats.traineesCreated++;
  return { ...traineeUserData, trainerUid };
}

export async function createGym(
  db: Firestore,
  auth: Auth,
  gymConfig: GymConfig,
  trainersIds: string[],
  traineesIds: string[]
) {
  const gymUid = gymConfig.id;
  const isPT = gymConfig.isPersonalTrainer || false;
  const roleType = isPT ? "personal_trainer" : "gimnasio";
  const photoURL = await resolveProfilePhoto(gymUid, gymConfig.nombre, roleType, gymConfig.plan);

  const gimnasioDoc = {
    id: gymUid,
    nombre: gymConfig.nombre,
    direccion: gymConfig.direccion,
    activo: true,
    isPersonalTrainer: isPT,
    plan: gymConfig.plan,
    entrenadoresIds: isPT ? [gymUid] : trainersIds,
    entrenadosIds: traineesIds,
    ...(photoURL ? { photoURL } : {}),
  };

  const gymUserData = {
    uid: gymUid,
    nombre: gymConfig.nombre,
    email: gymConfig.email,
    role: isPT ? "personal_trainer" : "gimnasio",
    onboarded: true,
    plan: gymConfig.plan || "free",
    fechaCreacion: Timestamp.now(),
    ...(photoURL ? { photoURL } : {}),
  };

  const dbPromises: Promise<unknown>[] = [
    db.collection("gimnasios").doc(gymUid).set(gimnasioDoc, { merge: true }),
    db.collection("usuarios").doc(gymUid).set(gymUserData, { merge: true }),
    ensureAuthUser(auth, gymUid, gymConfig.email, "admin123", gymConfig.nombre, undefined, photoURL),
  ];

  if (isPT) {
    dbPromises.push(
      db.collection("entrenadores").doc(gymUid).set(
        {
          id: gymUid,
          gimnasioId: gymUid,
          fechaRegistro: Timestamp.now(),
          entrenadosAsignadosIds: traineesIds,
          entrenadosPremiumIds: gymConfig.plan === "premium" ? traineesIds : [],
          ...(photoURL ? { photoURL } : {}),
        },
        { merge: true }
      ),
      db.collection("usuarios").doc(gymUid).set({ entrenadosAsignadosIds: traineesIds }, { merge: true })
    );
  } else {
    for (const trainerId of trainersIds) {
      dbPromises.push(
        db.collection("entrenadores").doc(trainerId).set({ gimnasioId: gymUid }, { merge: true }),
        db.collection("usuarios").doc(trainerId).set({ gimnasioId: gymUid }, { merge: true })
      );
    }
  }

  for (const traineeId of traineesIds) {
    dbPromises.push(
      db.collection("entrenados").doc(traineeId).set({ gimnasioId: gymUid }, { merge: true }),
      db.collection("usuarios").doc(traineeId).set({ gimnasioId: gymUid }, { merge: true })
    );
  }

  await Promise.all(dbPromises);
  stats.gymsCreated++;

  return { ...gimnasioDoc, role: gymUserData.role, email: gymConfig.email };
}