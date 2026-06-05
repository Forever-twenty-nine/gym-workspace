import { Auth } from "firebase-admin/auth";
import { Firestore } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { createGym } from "./entities";
import { seedConvocatorias, seedDesafios, seedFollowing, seedMatches } from "./social";
import { seedUsers } from "./users";
import { seedTrainerWorkouts } from "./workout";

export async function runSeed(db: Firestore, auth: Auth, config: SeedConfig) {
  const isPT = config.gym.isPersonalTrainer || false;
  console.log(
    `🚀 Generando Datos para ${isPT ? "Personal Trainer" : "Gimnasio"}: "${config.gym.nombre}" [Plan: ${config.gym.plan}]`
  );

  const { trainers, trainees } = await seedUsers(db, auth, config);
  const trainersForSocial = await seedTrainerWorkouts(db, config, isPT, config.gym.id, trainers, trainees);

  await seedFollowing(db, config, trainees);
  await seedDesafios(db, config, trainees);
  await seedMatches(db, config, trainees);
  await seedConvocatorias(db, config.gym.id, trainees, trainersForSocial);

  await createGym(
    db,
    auth,
    config.gym,
    trainers.map((t) => t.uid),
    trainees.map((t) => t.uid)
  );
}