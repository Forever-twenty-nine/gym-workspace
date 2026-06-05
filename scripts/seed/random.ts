import {
  DEFAULT_SEED,
  randomIntScoped,
  scopedRandom,
  shuffleArrayScoped,
  type SeedRandomMode,
} from "../utils/seed-rng";

let seedRandomMode: SeedRandomMode = { deterministic: false, seed: DEFAULT_SEED };

export function setSeedRandomMode(mode: SeedRandomMode) {
  seedRandomMode = mode;
}

export function getSeedRandomMode(): SeedRandomMode {
  return seedRandomMode;
}

export function rndInt(scope: string, min: number, max: number): number {
  if (!seedRandomMode.deterministic) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return randomIntScoped(scope, seedRandomMode.seed, min, max);
}

export function shuffleScoped<T>(items: T[], scope: string): T[] {
  if (!seedRandomMode.deterministic) {
    return [...items].sort(() => 0.5 - Math.random());
  }
  return shuffleArrayScoped(items, scope, seedRandomMode.seed);
}

export function sessionIdSuffix(traineeId: string, routineId: string): string {
  if (!seedRandomMode.deterministic) {
    return `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  const n = Math.floor(
    scopedRandom(`session:${traineeId}:${routineId}`, seedRandomMode.seed) * 1000
  );
  return `seed_${seedRandomMode.seed}_${n}`;
}