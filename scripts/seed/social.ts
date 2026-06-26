import { Firestore, Timestamp } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { stats } from "./context";
import { shuffleScoped } from "./random";
import { slugifyName } from "./uid";
import { SeedTraineeRef, SeedTrainerRef } from "./workout";
import type { Desafio } from "../../projects/gym-library/src/lib/models/desafio.model";
import type { MatchInteraction } from "../../projects/gym-library/src/lib/models/match-interaction.model";
import type { Convocatoria } from "../../projects/gym-library/src/lib/models/convocatoria.model";
import type { Mensaje } from "../../projects/gym-library/src/lib/models/mensaje.model";
import {
  buildDesafio,
  buildConvocatoria,
  buildMatch,
  buildMensaje,
  toFirestoreWrite,
} from "./builders";

export async function seedFollowing(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
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
    ).slice(0, Math.min(4, otherTrainees.length));

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
  // Un desafío por cada entrenado (generado dinámicamente)
  const desafioPromises = trainees.map(async (trainee, idx) => {
    const desafiosDisciplinas = [
      { disciplina: "Running", titulo: `¡Completé 5km en menos de 25 min! ¿Quién se anima? 🏃‍♂️` },
      { disciplina: "Powerlifting", titulo: `Sentadilla 100kg x 5 reps. ¿Quién me sigue el ritmo? 🏋️` },
      { disciplina: "Calistenia", titulo: `50 flexiones en serie. Reto para valientes 💪` },
      { disciplina: "Crossfit", titulo: `AMRAP 10 min: 10 burpees + 10 pull-ups. ¿Te sumás? 🔥` },
      { disciplina: "Musculación", titulo: `Press de banca 80kg x 3. ¡Nuevo record personal! 💥` },
      { disciplina: "Running", titulo: `10km bajo los 50 minutos. El cardio no miente 🎯` },
    ];
    const { disciplina, titulo } = desafiosDisciplinas[idx % desafiosDisciplinas.length];
    const desafioId = `desafio_${config.gym.id}_${trainee.uid}`;
    const desafio = buildDesafio({
      id: desafioId,
      creadorId: trainee.uid,
      creadorNombre: trainee.nombre,
      titulo,
      logroRelacionado: `${disciplina} - ${trainee.nombre}`,
      disciplina,
      activo: true,
      gimnasioId: config.gym.id,
    });
    await db.collection("desafios").doc(desafioId).set(toFirestoreWrite(desafio));
    stats.challengesCreated++;
  });

  // También sembrar los desafíos estáticos del config (para retrocompatibilidad)
  const staticDesafioPromises = (config.desafios || []).map(async (d) => {
    const matchTrainee = trainees.find(
      (t) => slugifyName(t.nombre) === d.creadorId.replace("trainee_", "")
    );
    const creadorIdFinal = matchTrainee ? matchTrainee.uid : d.creadorId;
    const creadorNombreFinal = matchTrainee ? matchTrainee.nombre : d.creadorNombre;
    const desafio = buildDesafio({
      id: d.id,
      creadorId: creadorIdFinal,
      creadorNombre: creadorNombreFinal,
      titulo: d.titulo,
      logroRelacionado: d.logroRelacionado,
      disciplina: d.disciplina,
      activo: d.activo,
      gimnasioId: config.gym.id,
    });
    // Solo crear si no existe ya uno dinámico con el mismo creador
    const exists = trainees.some((t) => t.uid === creadorIdFinal);
    if (!exists) {
      await db.collection("desafios").doc(d.id).set(toFirestoreWrite(desafio));
      stats.challengesCreated++;
    }
  });

  await Promise.all([...desafioPromises, ...staticDesafioPromises]);
}

export async function seedMatches(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
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

      const match = buildMatch({
        id: m.id,
        tipo: m.tipo as any,
        usuarioOrigenId: finalSourceId,
        usuarioDestinoId: finalDestId,
        interesOrigen: m.interesOrigen,
        interesDestino: m.interesDestino,
        mutuo: m.mutuo,
        gimnasioId: m.gimnasioId ?? config.gym.id,
      });
      await db.collection("matches").doc(m.id).set(toFirestoreWrite(match));
      stats.matchesCreated++;

      if (!m.mutuo) return;

      const msgId1 = `msg-seed-1-${m.id}`;
      const msgId2 = `msg-seed-2-${m.id}`;
      const msg1 = buildMensaje({
        id: msgId1,
        remitenteId: finalSourceId,
        destinatarioId: finalDestId,
        contenido: "¡Hola! Vi que nos gusta entrenar en el mismo horario. ¿Te parece si compartimos rutina mañana? 🏋️‍♂️💪",
        leido: false,
      });
      const msg2 = buildMensaje({
        id: msgId2,
        remitenteId: finalDestId,
        destinatarioId: finalSourceId,
        contenido: "¡Totalmente! Nos vemos a las 19:00 cerca de la zona de peso libre.",
        leido: true,
      });
      await Promise.all([
        db.collection("mensajes").doc(msgId1).set(toFirestoreWrite(msg1)),
        db.collection("mensajes").doc(msgId2).set(toFirestoreWrite(msg2)),
      ]);
      stats.messagesCreated += 2;
    })
  );
}

/**
 * Crea convocatorias para el gimnasio:
 * - 2 convocatorias oficiales de entrenadores (una por entrenador)
 * - 1 convocatoria por cada entrenado
 */
export async function seedConvocatorias(
  db: Firestore,
  gymUid: string,
  trainees: SeedTraineeRef[],
  trainers: SeedTrainerRef[]
) {
  const hoy = new Date();
  const convPromises: Promise<unknown>[] = [];

  // ─── Convocatorias de ENTRENADORES (2 por gimnasio, una por entrenador) ───
  const horasEntrenadores = [
    { horaInicio: "07:00", horaFin: "08:30" },
    { horaInicio: "18:00", horaFin: "19:30" },
  ];
  const mensajesEntrenador = [
    "💪 WOD del día: AMRAP 20 min - 5 Pull-ups, 10 Push-ups, 15 Squats. Vengan a dar el 100%.",
    "🏋️ Clase de fuerza: Powerlifting enfocado en sentadilla y peso muerto. ¡Técnica y carga máxima!",
  ];
  const titulosEntrenador = [
    "WOD del Día: Acondicionamiento Total",
    "Clase Especial: Fuerza y Técnica",
  ];

  for (let i = 0; i < Math.min(trainers.length, 2); i++) {
    const trainer = trainers[i];
    const daysAhead = i + 1;
    const fechaEntrenamiento = new Date(hoy);
    fechaEntrenamiento.setDate(hoy.getDate() + daysAhead);

    const convId = `conv-trainer-${trainer.uid}-${gymUid}`;
    convPromises.push(
      db.collection("convocatorias").doc(convId).set(
        toFirestoreWrite(
          buildConvocatoria({
            id: convId,
            creadorId: trainer.uid,
            creadorNombre: trainer.nombre,
            creadorFoto: trainer.photoURL || null,
            gimnasioId: gymUid,
            fechaEntrenamiento,
            horaInicio: horasEntrenadores[i].horaInicio,
            horaFin: horasEntrenadores[i].horaFin,
            mensaje: mensajesEntrenador[i],
            interesados: trainees.length > 0 ? [trainees[0].uid] : [],
            activo: true,
            creadorRol: "entrenador",
            titulo: titulosEntrenador[i],
            esOficial: true,
          })
        )
      )
    );
    stats.convocatoriasCreated++;
  }

  // ─── Convocatorias de ENTRENADOS (1 por entrenado) ───
  const mensajesEntrenado = [
    "¡Hoy toca rutina de tren superior! ¿Alguien me acompaña en la zona de peso libre? 💪🏋️‍♀️",
    "Pecho y bíceps mañana temprano. ¿Quién se une para las últimas reps al fallo? 🔥",
    "Piernas intensas esta tarde. Sentadilla y prensa hasta quemar. ¿Alguien? 🦵",
    "Cardio HIIT de 30 min. Más divertido en grupo. ¡Sumense! 🏃‍♂️💨",
    "Espalda y hombros. Dominadas + remo. Necesito compañía para rendir más 💪",
    "Funcional completo + core. Vengan a sudar juntos 🤸‍♂️",
  ];
  const horasEntrenado = [
    { horaInicio: "19:00", horaFin: "20:30" },
    { horaInicio: "08:00", horaFin: "09:30" },
    { horaInicio: "17:30", horaFin: "19:00" },
    { horaInicio: "06:30", horaFin: "08:00" },
    { horaInicio: "20:00", horaFin: "21:30" },
    { horaInicio: "10:00", horaFin: "11:30" },
  ];

  for (let i = 0; i < trainees.length; i++) {
    const trainee = trainees[i];
    const daysAhead = (i % 5) + 1;
    const fechaEntrenamiento = new Date(hoy);
    fechaEntrenamiento.setDate(hoy.getDate() + daysAhead);

    const convId = `conv-trainee-${trainee.uid}`;
    convPromises.push(
      db.collection("convocatorias").doc(convId).set(
        toFirestoreWrite(
          buildConvocatoria({
            id: convId,
            creadorId: trainee.uid,
            creadorNombre: trainee.nombre,
            creadorFoto: trainee.photoURL || null,
            gimnasioId: gymUid,
            fechaEntrenamiento,
            horaInicio: horasEntrenado[i % horasEntrenado.length].horaInicio,
            horaFin: horasEntrenado[i % horasEntrenado.length].horaFin,
            mensaje: mensajesEntrenado[i % mensajesEntrenado.length],
            interesados: [],
            activo: true,
            creadorRol: "entrenado",
            esOficial: false,
          })
        )
      )
    );
    stats.convocatoriasCreated++;
  }

  await Promise.all(convPromises);
}

export async function seedComentariosYLikes(
  db: Firestore,
  trainees: SeedTraineeRef[]
) {
  if (trainees.length === 0) return;

  // 1. Obtener la lista de seguidores de cada entrenado desde Firestore
  const entrenadosSnap = await db.collection("entrenados")
    .where("__name__", "in", trainees.map(t => t.uid))
    .get();

  const entrenadosData = new Map<string, any>();
  entrenadosSnap.forEach(docSnap => {
    entrenadosData.set(docSnap.id, docSnap.data());
  });

  // 2. Obtener todas las publicaciones (sesiones compartidas) de los entrenados del gym
  const sesionesSnap = await db.collection("sesiones-rutina")
    .where("entrenadoId", "in", trainees.map(t => t.uid))
    .where("compartida", "==", true)
    .get();

  const comentariosTemplates = [
    "Buen entrenamiento, sigue asi.",
    "Excelente rutina, me inspira a entrenar.",
    "Gran esfuerzo hoy.",
    "Que buen ritmo llevas.",
    "Impresionante la constancia.",
    "Manana entrenamos juntos sin falta.",
    "Se nota el progreso en cada sesion.",
    "Esa rutina es muy exigente, felicidades."
  ];

  const respuestasTemplates = [
    "Muchas gracias por el apoyo.",
    "Gracias, costo bastante terminar hoy.",
    "Dale, manana nos vemos en el gimnasio.",
    "Si, la verdad que se siente la diferencia.",
    "Gracias, sigamos entrenando duro."
  ];

  const promises: Promise<any>[] = [];

  for (const docSesion of sesionesSnap.docs) {
    const sesion = docSesion.data();
    const creadorId = sesion.entrenadoId;
    const seguidores = entrenadosData.get(creadorId)?.seguidores || [];

    if (seguidores.length === 0) continue;

    // A. Sembrar Likes a la sesión
    // Elegimos de forma aleatoria de 1 a todos los seguidores para dar Like
    const likesCount = Math.floor(Math.random() * seguidores.length) + 1;
    const likers = seguidores.slice(0, likesCount);
    promises.push(
      db.collection("sesiones-rutina").doc(docSesion.id).update({
        likes: likers
      })
    );

    // B. Sembrar Comentarios y Respuestas
    // Generar de 1 a 2 comentarios
    const numComentarios = Math.floor(Math.random() * Math.min(seguidores.length, 2)) + 1;
    for (let i = 0; i < numComentarios; i++) {
      const comentadorId = seguidores[i];
      const comentadorInfo = trainees.find(t => t.uid === comentadorId);
      if (!comentadorInfo) continue;

      const comentarioId = `comentario_seed_${docSesion.id}_${comentadorId}_${i}`;
      const comentarioContenido = comentariosTemplates[Math.floor(Math.random() * comentariosTemplates.length)];

      const comentarioDoc: any = {
        id: comentarioId,
        sesionId: docSesion.id,
        entrenadoId: comentadorId,
        nombreUsuario: comentadorInfo.nombre || "Usuario",
        fotoUsuario: comentadorInfo.photoURL || null,
        contenido: comentarioContenido,
        fecha: Timestamp.now(),
        likes: []
      };

      // A veces otros seguidores le dan like al comentario
      const otrosSeguidores = seguidores.filter((uid: string) => uid !== comentadorId);
      if (otrosSeguidores.length > 0 && Math.random() > 0.3) {
        const likesComentarioCount = Math.floor(Math.random() * otrosSeguidores.length) + 1;
        comentarioDoc.likes = otrosSeguidores.slice(0, likesComentarioCount);
      }

      // A veces el creador de la publicación responde al comentario
      if (Math.random() > 0.4) {
        const creadorInfo = trainees.find(t => t.uid === creadorId);
        comentarioDoc.respuesta = {
          id: `respuesta_seed_${comentarioId}`,
          entrenadoId: creadorId,
          nombreUsuario: creadorInfo?.nombre || "Creador",
          fotoUsuario: creadorInfo?.photoURL || null,
          contenido: respuestasTemplates[Math.floor(Math.random() * respuestasTemplates.length)],
          fecha: Timestamp.now()
        };
      }

      promises.push(
        db.collection("comentarios-social").doc(comentarioId).set(comentarioDoc)
      );
    }
  }

  await Promise.all(promises);
}