import { Timestamp } from "firebase-admin/firestore";
import { DEFAULT_SEED, parseSeedCliArgs } from "../utils/seed-rng";
import { ensureAuthUser } from "./auth";
import { clearAuthUsers, clearCollection, clearSeedProfile } from "./cleanup";
import {
  FIRESTORE_COLLECTIONS_TO_CLEAR,
  getSeedAuth,
  getSeedDb,
  initFirebaseEmulators,
} from "./context";
import { ALL_SEED_CONFIGS, resolveSeedConfig } from "./configs";
import { setSeedRandomMode } from "./random";
import { runSeed } from "./run-seed";

function printSeedHelp() {
  console.log(`
Uso: npm run db:seed [-- opciones]

Opciones:
  --config=<id|alias>   Sembrar un solo perfil (ej. gym-free-all-free)
  --deterministic       Datos reproducibles (semilla por defecto: ${DEFAULT_SEED})
  --seed=<número>       Semilla personalizada (implica --deterministic)
  --seed <número>       Igual que --seed=<número>
  --help                Muestra esta ayuda

Variables de entorno:
  SEED_DETERMINISTIC=1   Equivalente a --deterministic

Ejemplos:
  npm run db:seed
  npm run db:seed -- --deterministic
  npm run db:seed -- --config=gym-free-all-free --seed=2026
`);
}

/** @returns true si se ejecutó seed (mostrar resumen); false si solo ayuda */
export async function runSeedCli(argv: string[]): Promise<boolean> {
  initFirebaseEmulators();

  if (argv.includes("--help") || argv.includes("-h")) {
    printSeedHelp();
    return false;
  }

  const mode = parseSeedCliArgs(argv);
  setSeedRandomMode(mode);
  if (mode.deterministic) {
    console.log(`🎲 Modo determinístico activo (semilla: ${mode.seed})`);
  }

  const db = getSeedDb();
  const auth = getSeedAuth();

  const configArg = argv.find((arg) => arg.startsWith("--config="));
  const configName = configArg ? configArg.split("=")[1] : null;

  if (configName) {
    const selectedConfig = resolveSeedConfig(configName);
    if (!selectedConfig) {
      console.error(`❌ Perfil "${configName}" no reconocido.`);
      process.exit(1);
    }

    await clearSeedProfile(db, auth, selectedConfig);
    await runSeed(db, auth, selectedConfig);
    return true;
  }

  console.log("🚀 ========================================================");
  console.log("🚀 INICIANDO POBLADO UNIFICADO DE TODA LA BASE DE DATOS LOCAL");
  console.log("🚀 ========================================================\n");

  for (const collection of FIRESTORE_COLLECTIONS_TO_CLEAR) {
    await clearCollection(db, collection);
  }

  await clearAuthUsers(auth, ALL_SEED_CONFIGS);
  console.log("\n✨ Base de datos local completamente limpia. Iniciando inyecciones...\n");

  for (const config of ALL_SEED_CONFIGS) {
    await runSeed(db, auth, config);
  }

  console.log("🎉 ========================================================");
  console.log("🎉 POBLADO UNIFICADO FINALIZADO CON ÉXITO");
  console.log("🎉 ========================================================");

  console.log("\n👑 Creando Super Admin para Gym Admin...");
  await ensureAuthUser(auth, "super_admin_gym", "admin@gym.com", "admin123", "Super Admin", {
    admin: true,
  });
  await db.collection("usuarios").doc("super_admin_gym").set(
    {
      uid: "super_admin_gym",
      email: "admin@gym.com",
      nombre: "Super Admin",
      role: "admin",
      fechaCreacion: Timestamp.now(),
    },
    { merge: true }
  );
  console.log("👑 Super Admin creado con éxito (admin@gym.com / admin123)\n");
  return true;
}