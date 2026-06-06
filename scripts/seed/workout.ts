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

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

  // Note: we still use random here for variety in seed; the builder is used as base shape
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
  // override description for day info
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
  routineName: string
) {
  const sesionId = `session_${traineeId}_${sessionIdSuffix(traineeId, routineId)}`;
  const sesion = buildSesionRutinaMock(sesionId, traineeId, traineeName, routineId, routineName);
  await db.collection("sesiones-rutina").doc(sesionId).set(toFirestoreWrite(sesion));
  stats.sessionsCreated++;
}

export async function seedTraineeCreations(
  db: Firestore,
  config: SeedConfig,
  trainees: SeedTraineeRef[]
) {
  const createdExercisesByCreator: Record<string, string[]> = {};

  // Crear ejercicios self-authored por trainees (premium feature "creaciones")
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

  // Actualizar perfiles de los trainees con sus ejercicios creados
  for (const [creadorId, ids] of Object.entries(createdExercisesByCreator)) {
    if (ids.length > 0) {
      await Promise.all([
        db.collection("entrenados").doc(creadorId).set({ ejerciciosCreadosIds: ids }, { merge: true }),
        db.collection("usuarios").doc(creadorId).set({ ejerciciosCreadosIds: ids }, { merge: true }),
      ]);
    }
  }

  // Crear rutinas self-authored por trainees
  for (const rutConfig of config.traineeCreatedRoutines || []) {
    const ejerciciosForCreator = createdExercisesByCreator[rutConfig.creadorId] || [];
    if (ejerciciosForCreator.length === 0) continue;

    // Usar los ejercicios creados por él (hasta 5)
    const routineEjIds = ejerciciosForCreator.slice(0, 5);

    const trainee = trainees.find((t) => t.uid === rutConfig.creadorId);
    const nombreUsuario = trainee ? trainee.nombre : rutConfig.creadorNombre;

    const id = await createRoutine(
      db,
      rutConfig.nombre,
      "Personal",
      routineEjIds,
      rutConfig.creadorId, // usuarioId (dueño)
      nombreUsuario,
      rutConfig.creadorId  // creadorId = self (trainee)
    );

    // Actualizar el perfil del entrenado/usuario con rutinasCreadas
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
  if (isPT && trainersToProcess.length === 0) {
    trainersToProcess.push({
      uid: gymUid,
      nombre: config.gym.nombre,
      plan: config.gym.plan,
    });
  }

  for (const trainer of trainersToProcess) {
    // console.log(`   Creando ejercicios y rutinas para: ${trainer.nombre}`);


    const limitExercises = trainer.plan === Plan.FREE || config.gym.plan === Plan.FREE;
    const exercisesToCreate = limitExercises ? config.exercises.slice(0, 10) : config.exercises;

    const trainerExercises = await Promise.all(
      exercisesToCreate.map((exName) =>
        createExercise(db, exName, `Descripción detallada de ${exName}`, trainer.uid)
      )
    );

    const trainerDocUpdate = { ejerciciosCreadasIds: trainerExercises };
    if (!isPT || trainer.uid !== gymUid) {
      await Promise.all([
        db.collection("entrenadores").doc(trainer.uid).set(trainerDocUpdate, { merge: true }),
        db.collection("usuarios").doc(trainer.uid).set(trainerDocUpdate, { merge: true }),
      ]);
    }

    const trainerTrainees = trainees.filter((t) => t.trainerUid === trainer.uid);
    const allTrainerRoutines: string[] = [];

    await Promise.all(
      trainerTrainees.map(async (trainee) => {
        const numRutinas = trainee.plan === Plan.FREE
          ? 1
          : rndInt(`rutinas-count:${config.gym.id}:${trainer.uid}:${trainee.uid}`, 1, 3);

        const selectedDays = shuffleScoped(
          DIAS_SEMANA,
          `rutinas-dias:${config.gym.id}:${trainer.uid}:${trainee.uid}`
        ).slice(0, numRutinas);

        const routineIds: string[] = [];

        await Promise.all(
          selectedDays.map(async (dia) => {
            const routineExercises = shuffleScoped(
              trainerExercises,
              `rutina-ejercicios:${config.gym.id}:${trainer.uid}:${trainee.uid}:${dia}`
            ).slice(0, Math.min(5, trainerExercises.length));

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

        if (routineIds.length > 0) {
          const firstDay = selectedDays[0];
          await createMockSharedSession(
            db,
            trainee.uid,
            trainee.nombre,
            routineIds[0],
            `Rutina de ${firstDay} - ${trainee.nombre}`
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