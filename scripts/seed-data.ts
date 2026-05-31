import { initializeApp } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Timestamp, Firestore } from "firebase-admin/firestore";
import { Objetivo } from "../projects/gym-library/src/lib/enums/objetivo.enum";
import { SeedConfig, TrainerConfig, TraineeConfig, GymConfig, DesafioConfig, MatchConfig } from "./interfaces/seed-config.interface";

import { mockBios, mockTags, mockDisciplinas, mockFranjas, realGymExercises } from "./constants/common-mocks";
import { gymFreeAllFreeConfig } from "./constants/gym-free-all-free";
import { gymPremiumAllPremiumConfig } from "./constants/gym-premium-all-premium";
import { gymFreeMixedConfig } from "./constants/gym-free-mixed";
import { gymPremiumMixedConfig } from "./constants/gym-premium-mixed";
import { ptFreeAllFreeConfig } from "./constants/pt-free-all-free";
import { ptPremiumAllPremiumConfig } from "./constants/pt-premium-all-premium";

// Forzar emuladores en desarrollo
process.env['FIRESTORE_EMULATOR_HOST'] = process.env['FIRESTORE_EMULATOR_HOST'] || "127.0.0.1:8080";
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = process.env['FIREBASE_AUTH_EMULATOR_HOST'] || "127.0.0.1:9099";

initializeApp({ projectId: "demo-gym" });

const globalAuth = getAuth();
const globalDb = getFirestore();

/**
 * Asegura que exista el usuario en Firebase Authentication.
 */
export async function ensureAuthUser(
  auth: Auth,
  uid: string,
  email: string,
  password = "changeme123",
  displayName?: string,
  claims?: Record<string, any>
) {
  try {
    await auth.createUser({ uid, email, password, displayName });
    console.log(`🔐 Auth creado: ${email} (uid=${uid})`);
  } catch (e: any) {
    if (e.code === 'auth/email-already-exists' || e.code === 'auth/uid-already-exists') {
      try {
        await auth.updateUser(uid, { email, password, displayName });
        console.log(`🔁 Auth existente actualizado: ${email} (uid=${uid})`);
      } catch (uErr) {
        console.warn(`⚠️ No se pudo actualizar usuario auth ${uid}:`, uErr);
      }
    } else {
      console.error('❌ Error auth.createUser:', e);
    }
  }

  if (claims) {
    await auth.setCustomUserClaims(uid, claims);
    console.log(`🔑 Custom claims asignados a ${email}:`, claims);
  }
}

/**
 * Vacía por completo una colección de Firestore local en lotes (batch).
 */
export async function clearCollection(db: Firestore, collectionPath: string) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`🧹 Colección Firestore limpia: "${collectionPath}" (${snapshot.size} docs)`);
}

/**
 * Elimina de forma masiva los usuarios deterministicos del Firebase Authentication local.
 */
export async function clearAuthUsers(auth: Auth, configs: SeedConfig[]) {
  console.log("🧹 Limpiando usuarios antiguos de Firebase Auth local...");
  const uids: string[] = [];
  
  for (const config of configs) {
    uids.push(config.gym.id);
    
    for (const t of config.trainers) {
      const trainerUid = `trainer_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      uids.push(trainerUid);
    }
    
    for (const t of config.trainees) {
      const traineeUid = `trainee_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      uids.push(traineeUid);
    }
  }

  const uniqueUids = [...new Set(uids)];
  const chunkSize = 1000;
  for (let i = 0; i < uniqueUids.length; i += chunkSize) {
    const chunk = uniqueUids.slice(i, i + chunkSize);
    try {
      const result = await auth.deleteUsers(chunk);
    } catch (e) {
      console.warn("⚠️ Advertencia al limpiar Auth:", e);
    }
  }
}

/**
 * Crea un entrenador en la base de datos de usuarios y en la colección específica de entrenadores.
 */
export async function createTrainer(
  db: Firestore,
  auth: Auth,
  trainerConfig: TrainerConfig
) {
  const usuariosRef = db.collection('usuarios');
  const uid = `trainer_${trainerConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const trainerUserData = {
    uid,
    nombre: trainerConfig.name,
    email: trainerConfig.email,
    role: 'entrenador',
    plan: trainerConfig.plan,
    onboarded: true,
    fechaCreacion: Timestamp.now(),
    fechaRegistro: Timestamp.now()
  };

  const docRef = usuariosRef.doc(uid);
  await docRef.set(trainerUserData, { merge: true });
  await ensureAuthUser(auth, uid, trainerConfig.email, trainerConfig.password || "changeme123", trainerConfig.name);

  const entrenadoresRef = db.collection('entrenadores').doc(uid);
  await entrenadoresRef.set({
    id: uid,
    fechaRegistro: Timestamp.now(),
    ejerciciosCreadasIds: [],
    rutinasCreadasIds: [],
    entrenadosAsignadosIds: [],
    entrenadosPremiumIds: []
  }, { merge: true });

  return { ...trainerUserData };
}

/**
 * Crea un entrenado en la base de datos de usuarios y en la colección de entrenados, asociándolo a su entrenador.
 */
export async function createTrainee(
  db: Firestore,
  auth: Auth,
  traineeConfig: TraineeConfig,
  trainerUid: string,
  index: number
) {
  const usuariosRef = db.collection('usuarios');
  const uid = `trainee_${traineeConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const objetivos = [Objetivo.VOLUMEN, Objetivo.DEFINICION, Objetivo.FUERZA, Objetivo.SALUD];
  const objetivoAleatorio = objetivos[index % objetivos.length];

  const bio = mockBios[index % mockBios.length];
  const tags = mockTags[index % mockTags.length];
  const disciplinas = mockDisciplinas[index % mockDisciplinas.length];
  const franjaHoraria = mockFranjas[index % mockFranjas.length];

  const traineeUserData = {
    uid,
    nombre: traineeConfig.name,
    email: traineeConfig.email,
    role: 'entrenado',
    plan: traineeConfig.plan,
    onboarded: true,
    objetivo: objetivoAleatorio,
    fechaCreacion: Timestamp.now(),
    bio,
    tags,
    disciplinas,
    franjaHoraria,
    nivel: traineeConfig.nivel,
    seguidores: [],
    seguidos: []
  };

  const docRef = usuariosRef.doc(uid);
  await docRef.set(traineeUserData, { merge: true });
  await ensureAuthUser(auth, uid, traineeConfig.email, traineeConfig.password || "user123", traineeConfig.name);

  const entrenadosRef = db.collection('entrenados').doc(uid);
  await entrenadosRef.set({
    id: uid,
    objetivo: objetivoAleatorio,
    entrenadoresId: [trainerUid],
    rutinasAsignadasIds: [],
    fechaRegistro: Timestamp.now(),
    plan: traineeConfig.plan,
    bio,
    tags,
    disciplinas,
    franjaHoraria,
    nivel: traineeConfig.nivel,
    seguidores: [],
    seguidos: []
  }, { merge: true });

  try {
    const entrenadorRef = db.collection('entrenadores').doc(trainerUid);
    const entrenadorSnap = await entrenadorRef.get();
    const entrenadorData = entrenadorSnap.exists ? (entrenadorSnap.data() as Record<string, any>) : {};
    const existing = entrenadorData['entrenadosAsignadosIds'] || [];
    if (!existing.includes(uid)) {
      await entrenadorRef.set({ entrenadosAsignadosIds: [...new Set([...existing, uid])] }, { merge: true });
    }

    const usuarioTrainerRef = db.collection('usuarios').doc(trainerUid);
    const usuarioSnap = await usuarioTrainerRef.get();
    const usuarioData = usuarioSnap.exists ? (usuarioSnap.data() as Record<string, any>) : {};
    const existUsuarioAssigned: string[] = usuarioData['entrenadosAsignadosIds'] || [];
    if (!existUsuarioAssigned.includes(uid)) {
      await usuarioTrainerRef.set({ entrenadosAsignadosIds: [...new Set([...existUsuarioAssigned, uid])] }, { merge: true });
    }
  } catch (e) {
    console.warn('⚠️ No se pudo actualizar entrenador al crear entrenado:', e);
  }

  return { ...traineeUserData, trainerUid };
}

/**
 * Crea un Gimnasio o Personal Trainer en la base de datos de usuarios y gimnasios,
 * asociando a sus entrenadores y atletas e inicializando sus roles de forma reutilizable.
 */
export async function createGym(
  db: Firestore,
  auth: Auth,
  gymConfig: GymConfig,
  trainersIds: string[],
  traineesIds: string[]
) {
  const gymUid = gymConfig.id;
  const isPT = gymConfig.isPersonalTrainer || false;

  const gimnasioDoc = {
    id: gymUid,
    nombre: gymConfig.nombre,
    direccion: gymConfig.direccion,
    activo: true,
    isPersonalTrainer: isPT,
    plan: gymConfig.plan,
    entrenadoresIds: isPT ? [gymUid] : trainersIds,
    entrenadosIds: traineesIds
  };
  await db.collection('gimnasios').doc(gymUid).set(gimnasioDoc, { merge: true });

  const gymUserData = {
    uid: gymUid,
    nombre: gymConfig.nombre,
    email: gymConfig.email,
    role: isPT ? 'personal_trainer' : 'gimnasio',
    onboarded: true,
    plan: gymConfig.plan || 'free',
    fechaCreacion: Timestamp.now()
  };
  await db.collection('usuarios').doc(gymUid).set(gymUserData, { merge: true });
  await ensureAuthUser(auth, gymUid, gymConfig.email, 'admin123', gymConfig.nombre);

  if (isPT) {
    const ptTrainerData = {
      id: gymUid,
      gimnasioId: gymUid,
      fechaRegistro: Timestamp.now(),
      entrenadosAsignadosIds: traineesIds,
      entrenadosPremiumIds: gymConfig.plan === 'premium' ? traineesIds : []
    };
    await db.collection('entrenadores').doc(gymUid).set(ptTrainerData, { merge: true });
    await db.collection('usuarios').doc(gymUid).set({ entrenadosAsignadosIds: traineesIds }, { merge: true });
  } else {
    for (const trainerId of trainersIds) {
      await db.collection('entrenadores').doc(trainerId).set({ gimnasioId: gymUid }, { merge: true });
      await db.collection('usuarios').doc(trainerId).set({ gimnasioId: gymUid }, { merge: true });
    }
  }

  for (const traineeId of traineesIds) {
    await db.collection('entrenados').doc(traineeId).set({ gimnasioId: gymUid }, { merge: true });
    await db.collection('usuarios').doc(traineeId).set({ gimnasioId: gymUid }, { merge: true });
  }

  return { ...gimnasioDoc, role: gymUserData.role, email: gymConfig.email };
}

/**
 * Crea un ejercicio asociado opcionalmente a un entrenador.
 */
export async function createExercise(
  db: Firestore,
  nombre: string,
  descripcion: string,
  entrenadorId?: string
) {
  const data: any = {
    nombre,
    descripcion,
    series: Math.floor(Math.random() * 3) + 3,
    repeticiones: Math.floor(Math.random() * 5) + 8,
    peso: Math.floor(Math.random() * 20) + 10,
    fechaCreacion: Timestamp.now(),
    fechaModificacion: Timestamp.now()
  };
  if (entrenadorId) {
    data.creadorId = entrenadorId;
  }
  const ref = await db.collection('ejercicios').add(data);
  const id = ref.id;
  await ref.update({ id });
  return id;
}

/**
 * Crea una rutina.
 */
export async function createRoutine(
  db: Firestore,
  nombre: string,
  dia: string,
  ejerciciosIds: string[],
  usuarioId: string,
  nombreUsuario: string,
  entrenadorId?: string
) {
  console.log(`📝 Creando rutina: ${nombre} para usuario ${usuarioId}`);
  const data: any = {
    nombre,
    activa: true,
    descripcion: `Rutina ${nombre} - dia ${dia}`,
    ejerciciosIds,
    fechaCreacion: Timestamp.now(),
    fechaModificacion: Timestamp.now(),
    usuarioId,
    nombreUsuario,
  };
  if (entrenadorId) {
    data.creadorId = entrenadorId;
  }
  const docRef = db.collection('rutinas').doc();
  const id = docRef.id;
  await docRef.set({ ...data, id });
  console.log(`✅ Rutina creada en Firestore con ID: ${id}`);
  return id;
}

/**
 * Crea una sesión compartida mock.
 */
export async function createMockSharedSession(
  db: Firestore,
  traineeId: string,
  traineeName: string,
  routineId: string,
  routineName: string
) {
  const sesionId = `session_${traineeId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const data = {
    id: sesionId,
    entrenadoId: traineeId,
    fechaInicio: Timestamp.fromDate(new Date(Date.now() - 3600000 * 2)),
    fechaFin: Timestamp.fromDate(new Date(Date.now() - 3600000)),
    duracion: 3600,
    status: 'completada',
    completada: true,
    compartida: true,
    nombreUsuario: traineeName,
    fotoUsuario: null,
    fechaCompartida: Timestamp.now(),
    likes: [],
    rutinaResumen: {
      id: routineId,
      nombre: routineName,
      ejercicios: []
    }
  };
  await db.collection('sesiones-rutina').doc(sesionId).set(data);
  console.log(`📱 Creada sesión compartida mock: ${sesionId} para ${traineeName}`);
}

/**
 * Ejecuta el seed completo a partir de una configuración.
 */
export async function runSeed(db: Firestore, auth: Auth, config: SeedConfig) {
  const isPT = config.gym.isPersonalTrainer || false;
  console.log(`🚀 Generando Datos para ${isPT ? "Personal Trainer" : "Gimnasio"}: "${config.gym.nombre}" [Plan: ${config.gym.plan}]`);

  // 1) Crear entrenadores individuales (si existen)
  const createdTrainers: any[] = [];
  for (const t of config.trainers) {
    const created = await createTrainer(db, auth, t);
    createdTrainers.push(created);
  }

  // 2) Crear entrenados (balanceados o directos al PT)
  const createdTrainees: any[] = [];
  const numTrainers = createdTrainers.length;
  const gymUid = config.gym.id;

  if (numTrainers > 0) {
    for (let i = 0; i < config.trainees.length; i++) {
      const traineeConf = config.trainees[i];
      const assignedTrainer = createdTrainers[i % numTrainers];
      const created = await createTrainee(db, auth, traineeConf, assignedTrainer.uid, i);
      createdTrainees.push(created);
    }

    // Actualizar la lista de entrenados asignados en cada entrenador
    for (let i = 0; i < numTrainers; i++) {
      const trainer = createdTrainers[i];
      const trainerAssignedIds = createdTrainees
        .filter(t => t.trainerUid === trainer.uid)
        .map(t => t.uid);

      await db.collection('entrenadores').doc(trainer.uid).set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true });
      try {
        await db.collection('usuarios').doc(trainer.uid).set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true });
      } catch (uErr) {
        console.warn('⚠️ No se pudo actualizar usuario entrenador en `usuarios`:', uErr);
      }
    }
  } else if (isPT) {
    console.log(`   Asignando ${config.trainees.length} alumnos directamente al Personal Trainer...`);
    for (let i = 0; i < config.trainees.length; i++) {
      const traineeConf = config.trainees[i];
      const created = await createTrainee(db, auth, traineeConf, gymUid, i);
      createdTrainees.push(created);
    }
  }

  // 3) Crear ejercicios y asignar rutinas de forma uniforme
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const trainersToProcess = [...createdTrainers];
  if (isPT && trainersToProcess.length === 0) {
    trainersToProcess.push({
      uid: gymUid,
      nombre: config.gym.nombre,
      plan: config.gym.plan
    });
  }

  for (const trainer of trainersToProcess) {
    console.log(`   Creando ejercicios para: ${trainer.nombre}`);
    
    // Si el entrenador es Free o el gimnasio es Free, acotamos los ejercicios creados a un máximo de 10
    const limitExercises = (trainer.plan === 'free' || config.gym.plan === 'free');
    const exercisesToCreate = limitExercises ? config.exercises.slice(0, 10) : config.exercises;

    const trainerExercises: string[] = [];
    for (const exName of exercisesToCreate) {
      const exId = await createExercise(db, exName, `Descripción detallada de ${exName}`, trainer.uid);
      trainerExercises.push(exId);
    }

    const trainerDocUpdate = { ejerciciosCreadasIds: trainerExercises };
    if (!isPT || trainer.uid !== gymUid) {
      await db.collection('entrenadores').doc(trainer.uid).set(trainerDocUpdate, { merge: true });
      await db.collection('usuarios').doc(trainer.uid).set(trainerDocUpdate, { merge: true });
    }

    // Rutinas
    const trainerTrainees = createdTrainees.filter(t => t.trainerUid === trainer.uid);
    for (const trainee of trainerTrainees) {
      const isFreeUser = trainee.plan === 'free';
      const numRutinas = isFreeUser ? 1 : (Math.floor(Math.random() * 3) + 1);

      const shuffledDays = [...diasSemana].sort(() => 0.5 - Math.random());
      const selectedDays = shuffledDays.slice(0, numRutinas);

      const routineIds: string[] = [];
      for (const dia of selectedDays) {
        const routineExercises = [...trainerExercises].sort(() => 0.5 - Math.random()).slice(0, Math.min(5, trainerExercises.length));

        const routineName = `Rutina de ${dia} - ${trainee.nombre}`;
        const currentRoutineId = await createRoutine(db, routineName, dia, routineExercises, trainee.uid, trainee.nombre, trainer.uid);
        routineIds.push(currentRoutineId);

        try {
          const asignadaRef = await db.collection('rutinas-asignadas').add({
            rutinaId: currentRoutineId,
            entrenadoId: trainee.uid,
            entrenadorId: trainer.uid,
            diaSemana: dia,
            fechaAsignacion: Timestamp.now(),
            activa: true
          });
          await asignadaRef.update({ id: asignadaRef.id });
        } catch (e) {
          console.warn('⚠️ No se pudo crear rutina-asignada:', e);
        }
      }

      const traineeUpdate = {
        rutinasIds: routineIds,
        rutinasAsignadasIds: routineIds
      };
      await db.collection('usuarios').doc(trainee.uid).set(traineeUpdate, { merge: true });
      await db.collection('entrenados').doc(trainee.uid).set(traineeUpdate, { merge: true });

      if (routineIds.length > 0) {
        await createMockSharedSession(db, trainee.uid, trainee.nombre, routineIds[0], `Rutina de Fuerza - ${trainee.nombre}`);
      }

      if (!isPT || trainer.uid !== gymUid) {
        const entrenadorRef = db.collection('entrenadores').doc(trainer.uid);
        const snap = await entrenadorRef.get();
        const currentRoutines = snap.data()?.['rutinasCreadasIds'] || [];
        const trainerRoutineUpdate = { rutinasCreadasIds: [...new Set([...currentRoutines, ...routineIds])] };
        await entrenadorRef.set(trainerRoutineUpdate, { merge: true });
        await db.collection('usuarios').doc(trainer.uid).set(trainerRoutineUpdate, { merge: true });
      } else {
        const ptTrainerRef = db.collection('entrenadores').doc(gymUid);
        const snap = await ptTrainerRef.get();
        const currentRoutines = snap.exists ? (snap.data()?.['rutinasCreadasIds'] || []) : [];
        const ptTrainerUpdate = {
          ejerciciosCreadasIds: trainerExercises,
          rutinasCreadasIds: [...new Set([...currentRoutines, ...routineIds])]
        };
        await ptTrainerRef.set(ptTrainerUpdate, { merge: true });
      }
    }
  }

  // 4) Crear seguidores/seguidos
  console.log('   Estableciendo relaciones de seguimiento...');
  for (let i = 0; i < createdTrainees.length; i++) {
    const currentTrainee = createdTrainees[i];
    const otherTrainees = createdTrainees.filter(t => t.uid !== currentTrainee.uid);
    if (otherTrainees.length > 0) {
      const shuffled = otherTrainees.sort(() => 0.5 - Math.random());
      const toFollow = shuffled.slice(0, Math.min(2, shuffled.length));
      const seguidosIds = toFollow.map(t => t.uid);

      const currentRef = db.collection('entrenados').doc(currentTrainee.uid);
      const currentUserRef = db.collection('usuarios').doc(currentTrainee.uid);
      await currentRef.set({ seguidos: seguidosIds }, { merge: true });
      await currentUserRef.set({ seguidos: seguidosIds }, { merge: true });

      for (const targetTrainee of toFollow) {
        const targetRef = db.collection('entrenados').doc(targetTrainee.uid);
        const targetUserRef = db.collection('usuarios').doc(targetTrainee.uid);

        const targetSnap = await targetRef.get();
        const existingSeguidores = targetSnap.data()?.['seguidores'] || [];

        if (!existingSeguidores.includes(currentTrainee.uid)) {
          const updatedSeguidores = [...existingSeguidores, currentTrainee.uid];
          await targetRef.set({ seguidores: updatedSeguidores }, { merge: true });
          await targetUserRef.set({ seguidores: updatedSeguidores }, { merge: true });
        }
      }
    }
  }

  // 5) Crear desafíos mocks
  console.log('   Creando desafíos...');
  for (const d of config.desafios) {
    const matchTrainee = createdTrainees.find(t => t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '') === d.creadorId.replace('trainee_', ''));
    const finalCreatorId = matchTrainee ? matchTrainee.uid : d.creadorId;
    const finalCreatorName = matchTrainee ? matchTrainee.nombre : d.creadorNombre;

    await db.collection('desafios').doc(d.id).set({
      ...d,
      creadorId: finalCreatorId,
      creadorNombre: finalCreatorName,
      fechaCreacion: Timestamp.now()
    });
  }

  // 6) Crear interacciones/matches mocks
  console.log('   Creando matches fitness...');
  for (const m of config.matches) {
    const sourceTrainee = createdTrainees.find(t => t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '') === m.usuarioOrigenId.replace('trainee_', ''));
    const destTrainee = createdTrainees.find(t => t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '') === m.usuarioDestinoId.replace('trainee_', ''));

    const finalSourceId = sourceTrainee ? sourceTrainee.uid : m.usuarioOrigenId;
    const finalDestId = destTrainee ? destTrainee.uid : m.usuarioDestinoId;

    await db.collection('matches').doc(m.id).set({
      ...m,
      usuarioOrigenId: finalSourceId,
      usuarioDestinoId: finalDestId,
      fechaCreacion: Timestamp.now(),
      fechaMatch: m.mutuo ? Timestamp.now() : null
    });
  }

  // 7) Crear Gimnasio / Personal Trainer Central modularizado
  const trainersIds = createdTrainers.map(t => t.uid);
  const traineesIds = createdTrainees.map(t => t.uid);
  
  await createGym(db, auth, config.gym, trainersIds, traineesIds);
}

async function main() {
  const args = process.argv.slice(2);
  const configArg = args.find(arg => arg.startsWith('--config='));
  const configName = configArg ? configArg.split('=')[1] : null;

  const allConfigs: SeedConfig[] = [
    gymFreeAllFreeConfig,
    gymPremiumAllPremiumConfig,
    gymFreeMixedConfig,
    gymPremiumMixedConfig,
    ptFreeAllFreeConfig,
    ptPremiumAllPremiumConfig
  ];

  if (configName) {
    let selectedConfig = allConfigs.find(c => c.gym.id === configName || configName.replace(/[^a-z0-9]/g, '') === c.gym.nombre.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    if (configName === 'gym-free-all-free') selectedConfig = gymFreeAllFreeConfig;
    if (configName === 'gym-premium-all-premium') selectedConfig = gymPremiumAllPremiumConfig;
    if (configName === 'gym-free-mixed') selectedConfig = gymFreeMixedConfig;
    if (configName === 'gym-premium-mixed') selectedConfig = gymPremiumMixedConfig;
    if (configName === 'pt-free-all-free') selectedConfig = ptFreeAllFreeConfig;
    if (configName === 'pt-premium-all-premium') selectedConfig = ptPremiumAllPremiumConfig;

    if (!selectedConfig) {
      console.error(`❌ Perfil "${configName}" no reconocido.`);
      process.exit(1);
    }

    console.log(`🧹 Iniciando limpieza rápida para perfil individual: ${selectedConfig.gym.nombre}...`);
    await clearAuthUsers(globalAuth, [selectedConfig]);
    
    await globalDb.collection('usuarios').doc(selectedConfig.gym.id).delete();
    await globalDb.collection('gimnasios').doc(selectedConfig.gym.id).delete();
    await globalDb.collection('entrenadores').doc(selectedConfig.gym.id).delete();

    await runSeed(globalDb, globalAuth, selectedConfig);
  } else {
    console.log("🚀 ========================================================");
    console.log("🚀 INICIANDO POBLADO UNIFICADO DE TODA LA BASE DE DATOS LOCAL");
    console.log("🚀 ========================================================\n");

    const collectionsToClear = [
      'usuarios', 'entrenadores', 'entrenados', 'gimnasios', 
      'rutinas', 'ejercicios', 'rutinas-asignadas', 
      'sesiones-rutina', 'desafios', 'matches'
    ];
    for (const collection of collectionsToClear) {
      await clearCollection(globalDb, collection);
    }
    
    await clearAuthUsers(globalAuth, allConfigs);
    console.log("\n✨ Base de datos local completamente limpia. Iniciando inyecciones...\n");

    for (const config of allConfigs) {
      await runSeed(globalDb, globalAuth, config);
    }

    console.log("🎉 ========================================================");
    console.log("🎉 POBLADO UNIFICADO FINALIZADO CON ÉXITO");
    console.log("🎉 TODOS LOS GIMNASIOS Y PTs ESTÁN DISPONIBLES AL MISMO TIEMPO");
    console.log("🎉 ========================================================");

    console.log("\n👑 Creando Super Admin para Gym Admin...");
    await ensureAuthUser(
      globalAuth,
      'super_admin_gym',
      'admin@gym.com',
      'admin123',
      'Super Admin',
      { admin: true }
    );
    await globalDb.collection('usuarios').doc('super_admin_gym').set({
      uid: 'super_admin_gym',
      email: 'admin@gym.com',
      nombre: 'Super Admin',
      role: 'admin',
      fechaCreacion: Timestamp.now()
    }, { merge: true });
    console.log("👑 Super Admin creado con éxito (admin@gym.com / admin123)\n");
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error general en seed:', err);
    process.exit(1);
  });
}
