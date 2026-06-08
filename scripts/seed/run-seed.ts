import { Auth } from "firebase-admin/auth";
import { Firestore } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { createGym } from "./entities";
import { seedConvocatorias, seedDesafios, seedFollowing, seedMatches } from "./social";
import { seedUsers } from "./users";
import { seedTrainerWorkouts, seedTraineeCreations } from "./workout";

export async function runSeed(db: Firestore, auth: Auth, config: SeedConfig) {
  // minimal log only on error path; for quiet run, no per-config noise
  // console.log(`Seeding Gym: ${config.gym.nombre}`);

  const { trainers, trainees } = await seedUsers(db, auth, config);
  const trainersForSocial = await seedTrainerWorkouts(db, config, false, config.gym.id, trainers, trainees);

  await seedTraineeCreations(db, config, trainees);

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