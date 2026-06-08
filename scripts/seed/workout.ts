import { Firestore, Timestamp } from "firebase-admin/firestore";
import { SeedConfig } from "../interfaces/seed-config.interface";
import { Plan } from "../../projects/gym-library/src/lib/enums/plan.enum";
import { stats } from "./context";
import { rndInt, sessionIdSuffix, shuffleScoped } from "./random";
import type { Ejercicio } from "../../projects/gym-library/src/lib/models/ejercicio.model";
import type { Rutina } from "../../projects/gym-library/src/lib/models/rutina.model";
import type { RutinaAsignada } from "../../projects/gym-library/src/lib/models/rutina-asignada.model";
import type { SesionRutina } from "../../projects/gym-library/src/lib/models/sesion-rutina.model";
import {
  buildEjercicio,
  buildRutina,
  buildRutinaAsignada,
  buildSesionRutinaMock,
  toFirestoreWrite,
} from "./builders";
import { uploadPostImage } from "./storage";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Número exacto de ejercicios que crea cada entrenador */
const EXERCISES_PER_TRAINER = 9;
/** Número exacto de rutinas por entrenado (en días distintos) */
const ROUTINES_PER_TRAINEE = 3;
/** Número exacto de ejercicios por rutina */
const EXERCISES_PER_ROUTINE = 3;
/** Número de publicaciones (sesiones compartidas) por entrenado */
const SESSIONS_PER_TRAINEE = 2;

export interface SeedTrainerRef {
  uid: string;
  nombre: string;
  plan: Plan;
  photoURL?: string;
}

export interface SeedTraineeRef {
  uid: string;
  nombre: string;
  plan: Plan;
  trainerUid: string;
  photoURL?: string;
}

export async function createExercise(
  db: Firestore,
  nombre: string,
  descripcion: string,
  entrenadorId?: string
) {
  const ref = db.collection("ejercicios").doc();
  const id = ref.id;
  const scopeBase = `exercise:${entrenadorId ?? "global"}:${nombre}`;

  const base = buildEjercicio(id, nombre, descripcion, entrenadorId);
  const data = {
    ...base,
    series: rndInt(`${scopeBase}:series`, 3, 5),
    repeticiones: rndInt(`${scopeBase}:reps`, 8, 12),
    peso: rndInt(`${scopeBase}:peso`, 10, 29),
  };

  await ref.set(toFirestoreWrite(data));
  stats.exercisesCreated++;
  return id;
}

export async function createRoutine(
  db: Firestore,
  nombre: string,
  dia: string,
  ejerciciosIds: string[],
  usuarioId: string,
  nombreUsuario: string,
  entrenadorId?: string
) {
  const docRef = db.collection("rutinas").doc();
  const id = docRef.id;
  const data = buildRutina(id, nombre, ejerciciosIds, usuarioId, nombreUsuario, entrenadorId);
  (data as any).descripcion = `Rutina ${nombre} - dia ${dia}`;
  await docRef.set(toFirestoreWrite(data));
  stats.routinesCreated++;
  return id;
}

export async function createMockSharedSession(
  db: Firestore,
  traineeId: string,
  traineeName: string,
  routineId: string,
  routineName: string,
  sessionIndex: number,
  postPhotoURL?: string
) {
  const sesionId = `session_${traineeId}_${sessionIndex}_${sessionIdSuffix(traineeId, `${routineId}_${sessionIndex}`)}`;
  const sesion = buildSesionRutinaMock(sesionId, traineeId, traineeName, routineId, routineName, postPhotoURL);
  await db.collection("sesiones-rutina").doc(sesionId).set(toFirestoreWrite(sesion));
  stats.sessionsCreated++;
}

export async function seedTraineeCreations(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
  const createdExercisesByCreator: Record<string, string[]> = {};

  for (const exConfig of config.traineeCreatedExercises || []) {
    const id = await createExercise(
      db,
      exConfig.nombre,
      exConfig.descripcion || `Ejercicio creado por ${exConfig.creadorNombre}`,
      exConfig.creadorId
    );
    if (!createdExercisesByCreator[exConfig.creadorId]) {
      createdExercisesByCreator[exConfig.creadorId] = [];
    }
    createdExercisesByCreator[exConfig.creadorId].push(id);
  }

  for (const [creadorId, ids] of Object.entries(createdExercisesByCreator)) {
    if (ids.length > 0) {
      await Promise.all([
        db.collection("entrenados").doc(creadorId).set({ ejerciciosCreadosIds: ids }, { merge: true }),
        db.collection("usuarios").doc(creadorId).set({ ejerciciosCreadosIds: ids }, { merge: true }),
      ]);
    }
  }

  for (const rutConfig of config.traineeCreatedRoutines || []) {
    const ejerciciosForCreator = createdExercisesByCreator[rutConfig.creadorId] || [];
    if (ejerciciosForCreator.length === 0) continue;

    const routineEjIds = ejerciciosForCreator.slice(0, 5);

    const trainee = trainees.find((t) => t.uid === rutConfig.creadorId);
    const nombreUsuario = trainee ? trainee.nombre : rutConfig.creadorNombre;

    const id = await createRoutine(
      db,
      rutConfig.nombre,
      "Personal",
      routineEjIds,
      rutConfig.creadorId,
      nombreUsuario,
      rutConfig.creadorId
    );

    await Promise.all([
      db.collection("entrenados").doc(rutConfig.creadorId).set(
        { rutinasCreadas: [id] },
        { merge: true }
      ),
      db.collection("usuarios").doc(rutConfig.creadorId).set(
        { rutinasCreadas: [id] },
        { merge: true }
      ),
    ]);
  }
}

export async function seedTrainerWorkouts(
  db: Firestore,
  config: SeedConfig,
  isPT: boolean,
  gymUid: string,
  trainers: SeedTrainerRef[],
  trainees: SeedTraineeRef[]
) {
  const trainersToProcess: SeedTrainerRef[] = [...trainers];

  for (const trainer of trainersToProcess) {
    // Tomar exactamente los primeros EXERCISES_PER_TRAINER ejercicios del config
    const exerciseNames = config.exercises.slice(0, EXERCISES_PER_TRAINER);

    const trainerExercises = await Promise.all(
      exerciseNames.map((exName) =>
        createExercise(db, exName, `Descripción detallada de ${exName}`, trainer.uid)
      )
    );

    const trainerDocUpdate = { ejerciciosCreadasIds: trainerExercises };
    await Promise.all([
      db.collection("entrenadores").doc(trainer.uid).set(trainerDocUpdate, { merge: true }),
      db.collection("usuarios").doc(trainer.uid).set(trainerDocUpdate, { merge: true }),
    ]);

    const trainerTrainees = trainees.filter((t) => t.trainerUid === trainer.uid);
    const allTrainerRoutines: string[] = [];

    // Elegir ROUTINES_PER_TRAINEE días distintos para TODOS los trainees de este entrenador
    const baseDays = shuffleScoped(
      DIAS_SEMANA,
      `rutinas-dias:${config.gym.id}:${trainer.uid}`
    ).slice(0, ROUTINES_PER_TRAINEE);

    await Promise.all(
      trainerTrainees.map(async (trainee, traineeIdx) => {
        const routineIds: string[] = [];

        // Crear exactamente ROUTINES_PER_TRAINEE rutinas en días distintos
        await Promise.all(
          baseDays.map(async (dia, diaIdx) => {
            // Tomar exactamente EXERCISES_PER_ROUTINE ejercicios del pool del entrenador
            // Rotados por índice de día para que cada rutina tenga diferentes ejercicios
            const startIdx = (diaIdx * EXERCISES_PER_ROUTINE) % trainerExercises.length;
            const routineExercises = [
              ...trainerExercises.slice(startIdx, startIdx + EXERCISES_PER_ROUTINE),
              ...trainerExercises.slice(0, Math.max(0, EXERCISES_PER_ROUTINE - (trainerExercises.length - startIdx)))
            ].slice(0, EXERCISES_PER_ROUTINE);

            const routineName = `Rutina de ${dia} - ${trainee.nombre}`;
            const currentRoutineId = await createRoutine(
              db,
              routineName,
              dia,
              routineExercises,
              trainee.uid,
              trainee.nombre,
              trainer.uid
            );
            routineIds.push(currentRoutineId);

            try {
              const asignadaRef = db.collection("rutinas-asignadas").doc();
              const asignada = buildRutinaAsignada(asignadaRef.id, currentRoutineId, trainee.uid, trainer.uid, dia);
              await asignadaRef.set(toFirestoreWrite(asignada));
              stats.routinesAssigned++;
            } catch (e) {
              console.warn("⚠️ No se pudo crear rutina-asignada:", e);
            }
          })
        );

        allTrainerRoutines.push(...routineIds);

        await Promise.all([
          db.collection("usuarios").doc(trainee.uid).set(
            { rutinasIds: routineIds, rutinasAsignadasIds: routineIds },
            { merge: true }
          ),
          db.collection("entrenados").doc(trainee.uid).set(
            { rutinasIds: routineIds, rutinasAsignadasIds: routineIds },
            { merge: true }
          ),
        ]);

        // Crear exactamente SESSIONS_PER_TRAINEE publicaciones de entrenamientos completados.
        // Ambas sesiones usan fotos de entrenamiento (no fotos de perfil) para evitar
        // conflictos de género en los posts del feed.
        //   • Sesión 0 → post_workout_1 (índice 0)
        //   • Sesión 1 → post_workout_2 (índice 1)
        const postPhotoURLs = await Promise.all([
          uploadPostImage(trainee.uid, 0),
          uploadPostImage(trainee.uid, 1),
        ]);

        for (let sessionIdx = 0; sessionIdx < SESSIONS_PER_TRAINEE; sessionIdx++) {
          const routineForSession = routineIds[sessionIdx % routineIds.length];
          const diaForSession = baseDays[sessionIdx % baseDays.length];
          await createMockSharedSession(
            db,
            trainee.uid,
            trainee.nombre,
            routineForSession,
            `Rutina de ${diaForSession} - ${trainee.nombre}`,
            sessionIdx,
            postPhotoURLs[sessionIdx]
          );
        }
      })
    );

    if (allTrainerRoutines.length > 0) {
      if (!isPT || trainer.uid !== gymUid) {
        const entrenadorRef = db.collection("entrenadores").doc(trainer.uid);
        const snap = await entrenadorRef.get();
        const currentRoutines = snap.data()?.["rutinasCreadasIds"] || [];
        const trainerRoutineUpdate = {
          rutinasCreadasIds: [...new Set([...currentRoutines, ...allTrainerRoutines])],
        };
        await Promise.all([
          entrenadorRef.set(trainerRoutineUpdate, { merge: true }),
          db.collection("usuarios").doc(trainer.uid).set(trainerRoutineUpdate, { merge: true }),
        ]);
      } else {
        const ptTrainerRef = db.collection("entrenadores").doc(gymUid);
        const snap = await ptTrainerRef.get();
        const currentRoutines = snap.exists ? snap.data()?.["rutinasCreadasIds"] || [] : [];
        await ptTrainerRef.set(
          {
            ejerciciosCreadasIds: trainerExercises,
            rutinasCreadasIds: [...new Set([...currentRoutines, ...allTrainerRoutines])],
          },
          { merge: true }
        );
      }
    }
  }

  return trainersToProcess;
}