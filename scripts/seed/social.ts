import { Firestore, Timestamp } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { stats } from "./context";
import { shuffleScoped } from "./random";
import { slugifyName } from "./uid";
import { SeedTraineeRef, SeedTrainerRef } from "./workout";

export async function seedFollowing(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
  console.log("   Estableciendo relaciones de seguimiento...");

  const seguidosMap = new Map<string, Set<string>>();
  const seguidoresMap = new Map<string, Set<string>>();

  for (const t of trainees) {
    seguidosMap.set(t.uid, new Set());
    seguidoresMap.set(t.uid, new Set());
  }

  for (const currentTrainee of trainees) {
    const otherTrainees = trainees.filter((t) => t.uid !== currentTrainee.uid);
    if (otherTrainees.length === 0) continue;

    const toFollow = shuffleScoped(
      otherTrainees,
      `seguidos:${config.gym.id}:${currentTrainee.uid}`
    ).slice(0, Math.min(2, otherTrainees.length));

    for (const target of toFollow) {
      seguidosMap.get(currentTrainee.uid)!.add(target.uid);
      seguidoresMap.get(target.uid)!.add(currentTrainee.uid);
    }
  }

  await Promise.all(
    trainees.map(async (t) => {
      const seguidos = Array.from(seguidosMap.get(t.uid)!);
      const seguidores = Array.from(seguidoresMap.get(t.uid)!);
      await Promise.all([
        db.collection("entrenados").doc(t.uid).set({ seguidos, seguidores }, { merge: true }),
        db.collection("usuarios").doc(t.uid).set({ seguidos, seguidores }, { merge: true }),
      ]);
    })
  );
}

export async function seedDesafios(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
  console.log("   Creando desafíos...");
  await Promise.all(
    config.desafios.map(async (d) => {
      const matchTrainee = trainees.find(
        (t) => slugifyName(t.nombre) === d.creadorId.replace("trainee_", "")
      );
      await db.collection("desafios").doc(d.id).set({
        ...d,
        creadorId: matchTrainee ? matchTrainee.uid : d.creadorId,
        creadorNombre: matchTrainee ? matchTrainee.nombre : d.creadorNombre,
        fechaCreacion: Timestamp.now(),
      });
      stats.challengesCreated++;
    })
  );
}

export async function seedMatches(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
  console.log("   Creando matches fitness y mensajes asociados...");
  await Promise.all(
    config.matches.map(async (m) => {
      const sourceTrainee = trainees.find(
        (t) => slugifyName(t.nombre) === m.usuarioOrigenId.replace("trainee_", "")
      );
      const destTrainee = trainees.find(
        (t) => slugifyName(t.nombre) === m.usuarioDestinoId.replace("trainee_", "")
      );

      const finalSourceId = sourceTrainee ? sourceTrainee.uid : m.usuarioOrigenId;
      const finalDestId = destTrainee ? destTrainee.uid : m.usuarioDestinoId;

      await db.collection("matches").doc(m.id).set({
        ...m,
        usuarioOrigenId: finalSourceId,
        usuarioDestinoId: finalDestId,
        fechaCreacion: Timestamp.now(),
        fechaMatch: m.mutuo ? Timestamp.now() : null,
      });
      stats.matchesCreated++;

      if (!m.mutuo) return;

      const msgId1 = `msg-seed-1-${m.id}`;
      const msgId2 = `msg-seed-2-${m.id}`;
      await Promise.all([
        db.collection("mensajes").doc(msgId1).set({
          id: msgId1,
          remitenteId: finalSourceId,
          remitenteTipo: "entrenado",
          destinatarioId: finalDestId,
          destinatarioTipo: "entrenado",
          contenido:
            "¡Hola! Vi que nos gusta entrenar en el mismo horario. ¿Te parece si compartimos rutina mañana? 🏋️‍♂️💪",
          tipo: "TEXTO",
          leido: false,
          entregado: true,
          fechaEnvio: Timestamp.fromDate(new Date(Date.now() - 3600000)),
        }),
        db.collection("mensajes").doc(msgId2).set({
          id: msgId2,
          remitenteId: finalDestId,
          remitenteTipo: "entrenado",
          destinatarioId: finalSourceId,
          destinatarioTipo: "entrenado",
          contenido: "¡Totalmente! Nos vemos a las 19:00 cerca de la zona de peso libre.",
          tipo: "TEXTO",
          leido: true,
          entregado: true,
          fechaEnvio: Timestamp.now(),
        }),
      ]);
      stats.messagesCreated += 2;
    })
  );
}

export async function seedConvocatorias(
  db: Firestore,
  gymUid: string,
  trainees: SeedTraineeRef[],
  trainers: SeedTrainerRef[]
) {
  console.log("   Creando convocatorias fitness...");
  if (trainees.length < 2) return;

  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  const [t1, t2] = trainees;
  const convPromises: Promise<unknown>[] = [
    db.collection("convocatorias").doc(`conv-${t1.uid}-1`).set({
      id: `conv-${t1.uid}-1`,
      creadorId: t1.uid,
      creadorNombre: t1.nombre,
      creadorFoto: t1.photoURL || null,
      gimnasioId: gymUid,
      fechaCreacion: Timestamp.now(),
      fechaEntrenamiento: Timestamp.fromDate(hoy),
      horaInicio: "19:00",
      horaFin: "20:30",
      mensaje:
        "¡Hoy toca rutina de tren superior! ¿Alguien me acompaña en la zona de peso libre? 💪🏋️‍♀️",
      interesados: [],
      activo: true,
    }),
    db.collection("convocatorias").doc(`conv-${t2.uid}-2`).set({
      id: `conv-${t2.uid}-2`,
      creadorId: t2.uid,
      creadorNombre: t2.nombre,
      creadorFoto: t2.photoURL || null,
      gimnasioId: gymUid,
      fechaCreacion: Timestamp.now(),
      fechaEntrenamiento: Timestamp.fromDate(manana),
      horaInicio: "08:00",
      horaFin: "09:30",
      mensaje:
        "Pecho y bíceps mañana temprano. ¿Quién se une para ayudarnos a sacar las últimas reps al fallo? 🔥",
      interesados: [],
      activo: true,
    }),
  ];
  stats.convocatoriasCreated += 2;

  if (trainers.length > 0) {
    const trainer = trainers[0];
    convPromises.push(
      db.collection("convocatorias").doc(`conv-${trainer.uid}-wod`).set({
        id: `conv-${trainer.uid}-wod`,
        creadorId: trainer.uid,
        creadorNombre: trainer.nombre,
        creadorFoto: trainer.photoURL || null,
        gimnasioId: gymUid,
        fechaCreacion: Timestamp.now(),
        fechaEntrenamiento: Timestamp.fromDate(hoy),
        horaInicio: "08:00",
        horaFin: "09:30",
        mensaje:
          "Calentamiento: 5 min movilidad. WOD: AMRAP 20 min de: 5 Pull-ups, 10 Push-ups, 15 Squats. ¡A darlo todo! 🏋️‍♂️🔥",
        interesados: [t1.uid],
        activo: true,
        creadorRol: "entrenador",
        titulo: "WOD del Día: Resistencia Acondicionamiento",
        esOficial: true,
      }),
      db.collection("convocatorias").doc(`conv-${trainer.uid}-wod2`).set({
        id: `conv-${trainer.uid}-wod2`,
        creadorId: trainer.uid,
        creadorNombre: trainer.nombre,
        creadorFoto: trainer.photoURL || null,
        gimnasioId: gymUid,
        fechaCreacion: Timestamp.now(),
        fechaEntrenamiento: Timestamp.fromDate(manana),
        horaInicio: "18:00",
        horaFin: "19:30",
        mensaje:
          "Entrenamiento de fuerza enfocado en Powerlifting (Peso Muerto y Sentadilla). Técnica y series pesadas.",
        interesados: [],
        activo: true,
        creadorRol: "entrenador",
        titulo: "Clase Especial: Fuerza y Técnica",
        esOficial: true,
      })
    );
    stats.convocatoriasCreated += 2;
  }

  await Promise.all(convPromises);
}