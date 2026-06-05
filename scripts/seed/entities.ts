import { Auth } from "firebase-admin/auth";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { Objetivo } from "../../projects/gym-library/src/lib/enums/objetivo.enum";
import type { User } from "../../projects/gym-library/src/lib/models/user.model";
import type { Entrenador } from "../../projects/gym-library/src/lib/models/entrenador.model";
import type { Entrenado } from "../../projects/gym-library/src/lib/models/entrenado.model";
import type { Gimnasio } from "../../projects/gym-library/src/lib/models/gimnasio.model";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import {
  buildTrainerUser,
  buildEntrenadorDoc,
  buildTraineeUser,
  buildEntrenadoDoc,
  buildGymDoc,
  buildGymUser,
  toFirestoreWrite,
} from "./builders";
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

  const trainerUser = buildTrainerUser(uid, trainerConfig.name, trainerConfig.email, trainerConfig.plan, photoURL);
  const entrenadorDoc = buildEntrenadorDoc(uid);

  await Promise.all([
    db.collection("usuarios").doc(uid).set(toFirestoreWrite(trainerUser), { merge: true }),
    ensureAuthUser(
      auth,
      uid,
      trainerConfig.email,
      trainerConfig.password || "changeme123",
      trainerConfig.name,
      undefined,
      photoURL
    ),
    db.collection("entrenadores").doc(uid).set(toFirestoreWrite(entrenadorDoc), { merge: true }),
  ]);

  stats.trainersCreated++;
  return { ...trainerUser };
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

  const traineeUser = buildTraineeUser({
    uid,
    nombre: traineeConfig.name,
    email: traineeConfig.email,
    plan: traineeConfig.plan,
    nivel: traineeConfig.nivel,
    objetivo: objetivoAleatorio,
    bio,
    franjaHoraria,
    trainerUid,
    photoURL,
  });
  const entrenadoDoc = buildEntrenadoDoc({
    uid,
    nombre: traineeConfig.name,
    email: traineeConfig.email,
    plan: traineeConfig.plan,
    nivel: traineeConfig.nivel,
    objetivo: objetivoAleatorio,
    bio,
    franjaHoraria,
    trainerUid,
    photoURL,
  });

  await Promise.all([
    db.collection("usuarios").doc(uid).set(toFirestoreWrite(traineeUser), { merge: true }),
    ensureAuthUser(
      auth,
      uid,
      traineeConfig.email,
      traineeConfig.password || "user123",
      traineeConfig.name,
      undefined,
      photoURL
    ),
    db.collection("entrenados").doc(uid).set(toFirestoreWrite(entrenadoDoc), { merge: true }),
  ]);

  stats.traineesCreated++;
  return { ...traineeUser, trainerUid };
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

  const gimnasioDoc = buildGymDoc(
    { id: gymUid, nombre: gymConfig.nombre, email: gymConfig.email, direccion: gymConfig.direccion, plan: gymConfig.plan, isPersonalTrainer: isPT, photoURL },
    isPT ? [gymUid] : trainersIds,
    traineesIds
  );

  const gymUserData = buildGymUser(
    { id: gymUid, nombre: gymConfig.nombre, email: gymConfig.email, direccion: gymConfig.direccion, plan: gymConfig.plan, isPersonalTrainer: isPT, photoURL }
  );

  const dbPromises: Promise<unknown>[] = [
    db.collection("gimnasios").doc(gymUid).set(toFirestoreWrite(gimnasioDoc), { merge: true }),
    db.collection("usuarios").doc(gymUid).set(toFirestoreWrite(gymUserData), { merge: true }),
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
          entrenadosPremiumIds: gymConfig.plan === Plan.PREMIUM ? traineesIds : [],
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