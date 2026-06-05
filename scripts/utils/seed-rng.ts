/// <reference types="node" />

/** Semilla por defecto para `npm run db:seed -- --deterministic`. */
export const DEFAULT_SEED = 42;

/**
 * Hash FNV-1a de 32 bits para derivar semillas estables por ámbito.
 */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generador pseudoaleatorio determinístico (mulberry32).
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Número en [0, 1) derivado de un ámbito y semilla global (orden de ejecución independiente).
 */
export function scopedRandom(scope: string, globalSeed: number): number {
  return createSeededRng(hashString(`${globalSeed}:${scope}`))();
}

/**
 * Entero en [min, max] derivado de un ámbito (orden de ejecución independiente).
 */
export function randomIntScoped(
  scope: string,
  globalSeed: number,
  min: number,
  max: number
): number {
  const r = scopedRandom(scope, globalSeed);
  return Math.floor(r * (max - min + 1)) + min;
}

/**
 * Mezcla Fisher–Yates determinística por ámbito.
 */
export function shuffleArrayScoped<T>(items: T[], scope: string, globalSeed: number): T[] {
  const arr = [...items];
  const rng = createSeededRng(hashString(`${globalSeed}:${scope}`));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface SeedRandomMode {
  deterministic: boolean;
  seed: number;
}

export function parseSeedCliArgs(argv: string[]): SeedRandomMode {
  const seedDeterministic = process.env.SEED_DETERMINISTIC;
  const envDeterministic =
    seedDeterministic === "1" || seedDeterministic === "true";

  const seedFlag = argv.find((a) => a.startsWith('--seed='));
  const seedValueArg = argv.find((a) => a === '--seed');
  const seedIndex = seedValueArg ? argv.indexOf('--seed') : -1;
  const seedFromNext =
    seedIndex >= 0 && argv[seedIndex + 1] && !argv[seedIndex + 1].startsWith('--')
      ? argv[seedIndex + 1]
      : undefined;

  const explicitDeterministic = argv.includes('--deterministic');
  const hasSeedArg = Boolean(seedFlag || seedFromNext);

  if (!explicitDeterministic && !hasSeedArg && !envDeterministic) {
    return { deterministic: false, seed: DEFAULT_SEED };
  }

  const raw =
    seedFlag?.split('=')[1] ?? seedFromNext ?? String(DEFAULT_SEED);
  const parsed = parseInt(raw, 10);

  return {
    deterministic: true,
    seed: Number.isFinite(parsed) ? parsed : DEFAULT_SEED,
  };
}