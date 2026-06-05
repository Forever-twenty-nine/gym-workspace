import { SeedConfig } from "../interfaces/seed-config.interface";

export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function toSeedUid(role: "trainer" | "trainee", name: string): string {
  return `${role}_${slugifyName(name)}`;
}

export function getUidsFromSeedConfig(config: SeedConfig) {
  const gymUid = config.gym.id;
  const trainerUids = config.trainers.map((t) => toSeedUid("trainer", t.name));
  const traineeUids = config.trainees.map((t) => toSeedUid("trainee", t.name));
  const creatorUids = [...new Set([...trainerUids, gymUid])];
  const allUids = [...new Set([gymUid, ...trainerUids, ...traineeUids])];
  return { gymUid, trainerUids, traineeUids, creatorUids, allUids };
}