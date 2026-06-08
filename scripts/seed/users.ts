import { Auth } from "firebase-admin/auth";
import { Firestore } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { createTrainee, createTrainer } from "./entities";
import { SeedTraineeRef, SeedTrainerRef } from "./workout";
import type { Entrenador } from "../../projects/gym-library/src/lib/models/entrenador.model";
import type { Entrenado } from "../../projects/gym-library/src/lib/models/entrenado.model";
import type { User } from "../../projects/gym-library/src/lib/models/user.model";

export async function seedUsers(
  db: Firestore,
  auth: Auth,
  config: SeedConfig
): Promise<{ trainers: SeedTrainerRef[]; trainees: SeedTraineeRef[] }> {
  const createdTrainers = await Promise.all(
    config.trainers.map((t) => createTrainer(db, auth, t))
  );

  const trainers: SeedTrainerRef[] = createdTrainers.map((t) => ({
    uid: t.uid,
    nombre: t.nombre!,
    plan: t.plan!,
    photoURL: t.photoURL ?? undefined,
  }));

  const trainees: SeedTraineeRef[] = [];

  if (trainers.length > 0) {
    const createdTrainees = await Promise.all(
      config.trainees.map((traineeConf, i) => {
        const assignedTrainer = trainers[i % trainers.length];
        return createTrainee(db, auth, traineeConf, assignedTrainer.uid, i);
      })
    );

    trainees.push(
      ...createdTrainees.map((t) => ({
        uid: t.uid,
        nombre: t.nombre!,
        plan: t.plan!,
        trainerUid: t.trainerUid,
        photoURL: t.photoURL ?? undefined,
      }))
    );

    await Promise.all(
      trainers.map(async (trainer) => {
        const trainerAssignedIds = trainees
          .filter((t) => t.trainerUid === trainer.uid)
          .map((t) => t.uid);
        await Promise.all([
          db.collection("entrenadores").doc(trainer.uid).set(
            { entrenadosAsignadosIds: trainerAssignedIds } satisfies Partial<Entrenador>,
            { merge: true }
          ),
          db.collection("usuarios").doc(trainer.uid).set(
            { entrenadosAsignadosIds: trainerAssignedIds } satisfies Partial<User> & Record<string, unknown>,
            { merge: true }
          ),
        ]);
      })
    );
  }

  return { trainers, trainees };
}
