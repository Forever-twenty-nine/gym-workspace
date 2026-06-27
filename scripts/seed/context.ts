/// <reference types="node" />

import { initializeApp } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export interface SeedStats {
  authCreated: number;
  authUpdated: number;
  claimsAssigned: number;
  trainersCreated: number;
  traineesCreated: number;
  gymsCreated: number;
  exercisesCreated: number;
  routinesCreated: number;
  routinesAssigned: number;
  sessionsCreated: number;
  challengesCreated: number;
  matchesCreated: number;
  messagesCreated: number;
  convocatoriasCreated: number;
  collectionsCleared: string[];
}

export function createSeedStats(): SeedStats {
  return {
    authCreated: 0,
    authUpdated: 0,
    claimsAssigned: 0,
    trainersCreated: 0,
    traineesCreated: 0,
    gymsCreated: 0,
    exercisesCreated: 0,
    routinesCreated: 0,
    routinesAssigned: 0,
    sessionsCreated: 0,
    challengesCreated: 0,
    matchesCreated: 0,
    messagesCreated: 0,
    convocatoriasCreated: 0,
    collectionsCleared: [],
  };
}

export const stats = createSeedStats();

export const FIRESTORE_COLLECTIONS_TO_CLEAR = [
  "usuarios",
  "entrenadores",
  "entrenados",
  "gimnasios",
  "rutinas",
  "ejercicios",
  "rutinas-asignadas",
  "sesiones-rutina",
  "desafios",
  "matches",
  "convocatorias",
  "mensajes",
] as const;

let firebaseReady = false;

export function initFirebaseEmulators() {
  if (firebaseReady) return;

  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  process.env.FIREBASE_STORAGE_EMULATOR_HOST =
    process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";

  initializeApp({ projectId: "demo-gym" });
  firebaseReady = true;
}

export function getSeedDb(): Firestore {
  initFirebaseEmulators();
  return getFirestore();
}

export function getSeedAuth(): Auth {
  initFirebaseEmulators();
  return getAuth();
}

export function getSeedBucket() {
  initFirebaseEmulators();
  return getStorage().bucket("default-project.appspot.com");
}

export function printSummaryTable() {
  console.log("\n========================================================");
  console.log("RESUMEN DE EJECUCIÓN (SEED DATA SUMMARY)");
  console.log("========================================================");

  const cleaned = new Set(stats.collectionsCleared || []);

  const rows = [
    { Coleccion: "usuarios", Creados: stats.authCreated, Limpia: cleaned.has("usuarios") ? "✓" : "" },
    { Coleccion: "entrenadores", Creados: stats.trainersCreated, Limpia: cleaned.has("entrenadores") ? "✓" : "" },
    { Coleccion: "entrenados", Creados: stats.traineesCreated, Limpia: cleaned.has("entrenados") ? "✓" : "" },
    { Coleccion: "gimnasios", Creados: stats.gymsCreated, Limpia: cleaned.has("gimnasios") ? "✓" : "" },
    { Coleccion: "ejercicios", Creados: stats.exercisesCreated, Limpia: cleaned.has("ejercicios") ? "✓" : "" },
    { Coleccion: "rutinas", Creados: stats.routinesCreated, Limpia: cleaned.has("rutinas") ? "✓" : "" },
    { Coleccion: "rutinas-asignadas", Creados: stats.routinesAssigned, Limpia: cleaned.has("rutinas-asignadas") ? "✓" : "" },
    { Coleccion: "sesiones-rutina", Creados: stats.sessionsCreated, Limpia: cleaned.has("sesiones-rutina") ? "✓" : "" },
    { Coleccion: "desafios", Creados: stats.challengesCreated, Limpia: cleaned.has("desafios") ? "✓" : "" },
    { Coleccion: "matches", Creados: stats.matchesCreated, Limpia: cleaned.has("matches") ? "✓" : "" },
    { Coleccion: "mensajes", Creados: stats.messagesCreated, Limpia: cleaned.has("mensajes") ? "✓" : "" },
    { Coleccion: "convocatorias", Creados: stats.convocatoriasCreated, Limpia: cleaned.has("convocatorias") ? "✓" : "" },
    { Coleccion: "Usuarios Auth Actualizados", Creados: stats.authUpdated, Limpia: "" },
    { Coleccion: "Claims de Permisos Asignados", Creados: stats.claimsAssigned, Limpia: "" },
  ];

  // Manual box table (no (index) column, clean headers Coleccion | Creados | Limpia)
  function drawTable(headers: string[], data: any[][]) {
    const colWidths = headers.map((h: string, i: number) =>
      Math.max(h.length, ...data.map((row: any[]) => String(row[i]).length))
    );

    const top = '┌' + colWidths.map((w: number) => '─'.repeat(w + 2)).join('┬') + '┐';
    const sep = '├' + colWidths.map((w: number) => '─'.repeat(w + 2)).join('┼') + '┤';
    const bot = '└' + colWidths.map((w: number) => '─'.repeat(w + 2)).join('┴') + '┘';

    const headerRow = '│ ' + headers.map((h: string, i: number) => h.padEnd(colWidths[i])).join(' │ ') + ' │';

    console.log(top);
    console.log(headerRow);
    console.log(sep);

    for (const row of data) {
      const line = '│ ' + row.map((cell: any, i: number) => String(cell).padEnd(colWidths[i])).join(' │ ') + ' │';
      console.log(line);
    }

    console.log(bot);
  }

  const headers = ['Coleccion', 'Creados', 'Limpia'];
  const data = rows.map(r => [r.Coleccion, r.Creados, r.Limpia]);
  drawTable(headers, data);

  console.log("========================================================\n");
}