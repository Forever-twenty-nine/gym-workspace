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
  console.log("\n📊 ========================================================");
  console.log("📊 RESUMEN DE EJECUCIÓN (SEED DATA SUMMARY)");
  console.log("📊 ========================================================");
  console.table({
    "Usuarios Auth Creados": stats.authCreated,
    "Usuarios Auth Actualizados": stats.authUpdated,
    "Claims de Permisos Asignados": stats.claimsAssigned,
    "Entrenadores Creados": stats.trainersCreated,
    "Atletas (Trainees) Creados": stats.traineesCreated,
    "Gimnasios / PTs Creados": stats.gymsCreated,
    "Ejercicios Creados": stats.exercisesCreated,
    "Rutinas Creadas": stats.routinesCreated,
    "Rutinas Asignadas": stats.routinesAssigned,
    "Sesiones Compartidas Mock": stats.sessionsCreated,
    "Desafíos Creados": stats.challengesCreated,
    "Matches Fitness Creados": stats.matchesCreated,
    "Mensajes Mock Creados": stats.messagesCreated,
    "Convocatorias Fitness Creadas": stats.convocatoriasCreated,
  });
  if (stats.collectionsCleared.length > 0) {
    console.log(`🧹 Colecciones Firestore limpiadas: ${stats.collectionsCleared.join(", ")}`);
  }
  console.log("========================================================\n");
}