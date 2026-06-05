import { Auth } from "firebase-admin/auth";
import { Firestore, DocumentReference } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { stats } from "./context";
import { getUidsFromSeedConfig } from "./uid";

const FIRESTORE_BATCH_DELETE_LIMIT = 400;
const FIRESTORE_IN_QUERY_LIMIT = 30;

async function deleteDocumentRefs(db: Firestore, refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_DELETE_LIMIT) {
    const batch = db.batch();
    refs.slice(i, i + FIRESTORE_BATCH_DELETE_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function clearCollectionWhereIn(
  db: Firestore,
  collectionPath: string,
  field: string,
  values: string[]
) {
  if (values.length === 0) return;

  const refs: DocumentReference[] = [];
  for (let i = 0; i < values.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = values.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    const snapshot = await db.collection(collectionPath).where(field, "in", chunk).get();
    snapshot.docs.forEach((doc) => refs.push(doc.ref));
  }

  await deleteDocumentRefs(db, refs);
}

export async function clearCollection(db: Firestore, collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  let deletedAny = false;

  while (true) {
    const snapshot = await collectionRef.limit(FIRESTORE_BATCH_DELETE_LIMIT).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deletedAny = true;
  }

  if (deletedAny) {
    stats.collectionsCleared.push(collectionPath);
  }
}

export async function clearAuthUsers(auth: Auth, configs: SeedConfig[]) {
  const uniqueUids = [...new Set(configs.flatMap((c) => getUidsFromSeedConfig(c).allUids))];
  const chunkSize = 1000;
  for (let i = 0; i < uniqueUids.length; i += chunkSize) {
    const chunk = uniqueUids.slice(i, i + chunkSize);
    try {
      await auth.deleteUsers(chunk);
    } catch (e) {
      console.warn("⚠️ Advertencia al limpiar Auth:", e);
    }
  }
}

export async function clearSeedProfile(db: Firestore, auth: Auth, config: SeedConfig) {
  const { gymUid, trainerUids, traineeUids, creatorUids, allUids } = getUidsFromSeedConfig(config);

  console.log(`🧹 Limpiando perfil: ${config.gym.nombre}...`);

  await clearCollectionWhereIn(db, "rutinas-asignadas", "entrenadoId", traineeUids);
  await clearCollectionWhereIn(db, "sesiones-rutina", "entrenadoId", traineeUids);
  await clearCollectionWhereIn(db, "rutinas", "usuarioId", traineeUids);
  await clearCollectionWhereIn(db, "rutinas", "creadorId", creatorUids);
  await clearCollectionWhereIn(db, "ejercicios", "creadorId", creatorUids);
  await clearCollectionWhereIn(db, "convocatorias", "gimnasioId", [gymUid]);
  await clearCollectionWhereIn(db, "matches", "usuarioOrigenId", traineeUids);
  await clearCollectionWhereIn(db, "matches", "usuarioDestinoId", traineeUids);
  await clearCollectionWhereIn(db, "mensajes", "remitenteId", allUids);
  await clearCollectionWhereIn(db, "mensajes", "destinatarioId", allUids);

  const knownDocDeletes: Promise<unknown>[] = [
    ...config.desafios.map((d) => db.collection("desafios").doc(d.id).delete()),
    ...config.matches.map((m) => db.collection("matches").doc(m.id).delete()),
    ...config.matches
      .filter((m) => m.mutuo)
      .flatMap((m) => [
        db.collection("mensajes").doc(`msg-seed-1-${m.id}`).delete(),
        db.collection("mensajes").doc(`msg-seed-2-${m.id}`).delete(),
      ]),
  ];
  await Promise.all(knownDocDeletes);

  const coreRefs: DocumentReference[] = [
    db.collection("gimnasios").doc(gymUid),
    ...allUids.map((uid) => db.collection("usuarios").doc(uid)),
    ...trainerUids.map((uid) => db.collection("entrenadores").doc(uid)),
    ...traineeUids.map((uid) => db.collection("entrenados").doc(uid)),
  ];
  if (config.gym.isPersonalTrainer) {
    coreRefs.push(db.collection("entrenadores").doc(gymUid));
  }
  await deleteDocumentRefs(db, coreRefs);

  await clearAuthUsers(auth, [config]);
}