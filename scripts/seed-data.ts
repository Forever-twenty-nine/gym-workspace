import { initializeApp } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Timestamp, Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { Objetivo } from "../projects/gym-library/src/lib/enums/objetivo.enum";
import { SeedConfig, TrainerConfig, TraineeConfig, GymConfig, DesafioConfig, MatchConfig } from "./interfaces/seed-config.interface";

import { mockBios, mockTags, mockDisciplinas, mockFranjas, realGymExercises } from "./constants/common-mocks";
import { gymFreeAllFreeConfig } from "./constants/gym-free-all-free";
import { gymPremiumAllPremiumConfig } from "./constants/gym-premium-all-premium";
import { ptFreeAllFreeConfig } from "./constants/pt-free-all-free";
import { ptPremiumAllPremiumConfig } from "./constants/pt-premium-all-premium";

// Forzar emuladores en desarrollo
process.env['FIRESTORE_EMULATOR_HOST'] = process.env['FIRESTORE_EMULATOR_HOST'] || "127.0.0.1:8080";
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = process.env['FIREBASE_AUTH_EMULATOR_HOST'] || "127.0.0.1:9099";
process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = process.env['FIREBASE_STORAGE_EMULATOR_HOST'] || "127.0.0.1:9199";

initializeApp({ projectId: "demo-gym" });

const globalAuth = getAuth();
const globalDb = getFirestore();
const globalBucket = getStorage().bucket("default-project.appspot.com");

// Objeto de estadísticas para reporte final consolidado
const stats = {
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
  collectionsCleared: [] as string[]
};

/**
 * Retorna el nombre de la imagen local de perfil correspondiente
 */
function getLocalImageName(name: string, role: string, plan: string): string {
  const normalized = name.toLowerCase();
  const isPremium = plan === 'premium';
  
  if (role === 'gimnasio') {
    return isPremium ? 'gym_premium.png' : 'gym_free.png';
  }
  
  if (role === 'entrenador' || role === 'personal_trainer') {
    const isFemale = normalized.includes('ana') || normalized.includes('maria') || normalized.includes('valeria');
    if (isFemale) {
      return isPremium ? 'trainer_premium_female.png' : 'trainer_free_female.png';
    } else {
      return isPremium ? 'trainer_premium_male.png' : 'trainer_free_male.png';
    }
  } else {
    // Entrenado
    const isFemale = normalized.includes('maria') || normalized.includes('sofia') || normalized.includes('clara') ||
                     normalized.includes('lucia') || normalized.includes('carmen') || normalized.includes('isabel') ||
                     normalized.includes('patricia') || normalized.includes('carla') || normalized.includes('daniela') ||
                     normalized.includes('florencia') || normalized.includes('marina') || normalized.includes('alumna');
    if (isFemale) {
      return isPremium ? 'trainee_premium_female.png' : 'trainee_free_female.png';
    } else {
      return isPremium ? 'trainee_premium_male.png' : 'trainee_free_male.png';
    }
  }
}

/**
 * Sube una imagen de perfil al Firebase Storage local y retorna su URL pública
 */
export async function uploadProfileImage(userId: string, localImageName: string): Promise<string> {
  const localPath = `c:\\repositorios\\gym-workspace\\projects\\gym-app\\src\\assets\\images\\profiles\\${localImageName}`;
  const destination = `profiles/${userId}/profile.png`;
  
  try {
    await globalBucket.upload(localPath, {
      destination,
      metadata: {
        contentType: 'image/png',
      }
    });
    return `http://127.0.0.1:9199/v0/b/default-project.appspot.com/o/profiles%2F${userId}%2Fprofile.png?alt=media`;
  } catch (e) {
    console.warn(`⚠️ No se pudo subir la imagen de perfil para ${userId} a Storage:`, e);
    return `assets/images/profiles/${localImageName}`;
  }
}

/**
 * Asegura que exista el usuario en Firebase Authentication.
 */
export async function ensureAuthUser(
  auth: Auth,
  uid: string,
  email: string,
  password = "changeme123",
  displayName?: string,
  claims?: Record<string, any>,
  photoURL?: string
) {
  try {
    await auth.createUser({ uid, email, password, displayName, photoURL });
    stats.authCreated++;
  } catch (e: any) {
    if (e.code === 'auth/email-already-exists' || e.code === 'auth/uid-already-exists') {
      try {
        await auth.updateUser(uid, { email, password, displayName, photoURL });
        stats.authUpdated++;
      } catch (uErr) {
        console.warn(`⚠️ No se pudo actualizar usuario auth ${uid}:`, uErr);
      }
    } else {
      console.error('❌ Error auth.createUser:', e);
    }
  }

  if (claims) {
    await auth.setCustomUserClaims(uid, claims);
    stats.claimsAssigned++;
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
  stats.collectionsCleared.push(collectionPath);
}

/**
 * Elimina de forma masiva los usuarios deterministicos del Firebase Authentication local.
 */
export async function clearAuthUsers(auth: Auth, configs: SeedConfig[]) {
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
      await auth.deleteUsers(chunk);
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
  const uid = `trainer_${trainerConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const localImage = getLocalImageName(trainerConfig.name, 'entrenador', trainerConfig.plan);
  const photoURL = await uploadProfileImage(uid, localImage);

  const trainerUserData = {
    uid,
    nombre: trainerConfig.name,
    email: trainerConfig.email,
    role: 'entrenador',
    plan: trainerConfig.plan,
    onboarded: true,
    photoURL,
    fechaCreacion: Timestamp.now(),
    fechaRegistro: Timestamp.now()
  };

  await Promise.all([
    db.collection('usuarios').doc(uid).set(trainerUserData, { merge: true }),
    ensureAuthUser(auth, uid, trainerConfig.email, trainerConfig.password || "changeme123", trainerConfig.name, undefined, photoURL),
    db.collection('entrenadores').doc(uid).set({
      id: uid,
      fechaRegistro: Timestamp.now(),
      ejerciciosCreadasIds: [],
      rutinasCreadasIds: [],
      entrenadosAsignadosIds: [],
      entrenadosPremiumIds: []
    }, { merge: true })
  ]);

  stats.trainersCreated++;
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
  const uid = `trainee_${traineeConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const objetivos = [Objetivo.VOLUMEN, Objetivo.DEFINICION, Objetivo.FUERZA, Objetivo.SALUD];
  const objetivoAleatorio = objetivos[index % objetivos.length];

  const bio = mockBios[index % mockBios.length];
  const franjaHoraria = mockFranjas[index % mockFranjas.length];

  const localImage = getLocalImageName(traineeConfig.name, 'entrenado', traineeConfig.plan);
  const photoURL = await uploadProfileImage(uid, localImage);

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
    franjaHoraria,
    nivel: traineeConfig.nivel,
    seguidores: [],
    seguidos: [],
    visibleDescubrir: true,
    photoURL
  };

  await Promise.all([
    db.collection('usuarios').doc(uid).set(traineeUserData, { merge: true }),
    ensureAuthUser(auth, uid, traineeConfig.email, traineeConfig.password || "user123", traineeConfig.name, undefined, photoURL),
    db.collection('entrenados').doc(uid).set({
      id: uid,
      objetivo: objetivoAleatorio,
      entrenadoresId: [trainerUid],
      rutinasAsignadasIds: [],
      fechaRegistro: Timestamp.now(),
      plan: traineeConfig.plan,
      bio,
      franjaHoraria,
      nivel: traineeConfig.nivel,
      seguidores: [],
      seguidos: [],
      visibleDescubrir: true,
      photoURL
    }, { merge: true })
  ]);

  stats.traineesCreated++;
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
  const roleType = isPT ? 'personal_trainer' : 'gimnasio';

  const localImage = getLocalImageName(gymConfig.nombre, roleType, gymConfig.plan);
  const photoURL = await uploadProfileImage(gymUid, localImage);

  const gimnasioDoc = {
    id: gymUid,
    nombre: gymConfig.nombre,
    direccion: gymConfig.direccion,
    activo: true,
    isPersonalTrainer: isPT,
    plan: gymConfig.plan,
    entrenadoresIds: isPT ? [gymUid] : trainersIds,
    entrenadosIds: traineesIds,
    ...(photoURL ? { photoURL } : {})
  };

  const gymUserData = {
    uid: gymUid,
    nombre: gymConfig.nombre,
    email: gymConfig.email,
    role: isPT ? 'personal_trainer' : 'gimnasio',
    onboarded: true,
    plan: gymConfig.plan || 'free',
    fechaCreacion: Timestamp.now(),
    ...(photoURL ? { photoURL } : {})
  };

  const dbPromises: Promise<any>[] = [
    db.collection('gimnasios').doc(gymUid).set(gimnasioDoc, { merge: true }),
    db.collection('usuarios').doc(gymUid).set(gymUserData, { merge: true }),
    ensureAuthUser(auth, gymUid, gymConfig.email, 'admin123', gymConfig.nombre, undefined, photoURL)
  ];

  if (isPT) {
    const ptTrainerData = {
      id: gymUid,
      gimnasioId: gymUid,
      fechaRegistro: Timestamp.now(),
      entrenadosAsignadosIds: traineesIds,
      entrenadosPremiumIds: gymConfig.plan === 'premium' ? traineesIds : [],
      ...(photoURL ? { photoURL } : {})
    };
    dbPromises.push(
      db.collection('entrenadores').doc(gymUid).set(ptTrainerData, { merge: true }),
      db.collection('usuarios').doc(gymUid).set({ entrenadosAsignadosIds: traineesIds }, { merge: true })
    );
  } else {
    for (const trainerId of trainersIds) {
      dbPromises.push(
        db.collection('entrenadores').doc(trainerId).set({ gimnasioId: gymUid }, { merge: true }),
        db.collection('usuarios').doc(trainerId).set({ gimnasioId: gymUid }, { merge: true })
      );
    }
  }

  for (const traineeId of traineesIds) {
    dbPromises.push(
      db.collection('entrenados').doc(traineeId).set({ gimnasioId: gymUid }, { merge: true }),
      db.collection('usuarios').doc(traineeId).set({ gimnasioId: gymUid }, { merge: true })
    );
  }

  await Promise.all(dbPromises);
  stats.gymsCreated++;

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
  const ref = db.collection('ejercicios').doc();
  const id = ref.id;

  const data: any = {
    id,
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

  await ref.set(data);
  stats.exercisesCreated++;
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
  stats.routinesCreated++;
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
  stats.sessionsCreated++;
}

/**
 * Ejecuta el seed completo a partir de una configuración.
 */
export async function runSeed(db: Firestore, auth: Auth, config: SeedConfig) {
  const isPT = config.gym.isPersonalTrainer || false;
  console.log(`🚀 Generando Datos para ${isPT ? "Personal Trainer" : "Gimnasio"}: "${config.gym.nombre}" [Plan: ${config.gym.plan}]`);

  // 1) Crear entrenadores individuales (si existen)
  const createdTrainers = await Promise.all(
    config.trainers.map(t => createTrainer(db, auth, t))
  );

  // 2) Crear entrenados (balanceados o directos al PT)
  const createdTrainees: any[] = [];
  const numTrainers = createdTrainers.length;
  const gymUid = config.gym.id;

  if (numTrainers > 0) {
    createdTrainees.push(...await Promise.all(
      config.trainees.map((traineeConf, i) => {
        const assignedTrainer = createdTrainers[i % numTrainers];
        return createTrainee(db, auth, traineeConf, assignedTrainer.uid, i);
      })
    ));

    // Actualizar la lista de entrenados asignados en cada entrenador de manera consolidada
    await Promise.all(createdTrainers.map(async (trainer) => {
      const trainerAssignedIds = createdTrainees
        .filter(t => t.trainerUid === trainer.uid)
        .map(t => t.uid);

      await Promise.all([
        db.collection('entrenadores').doc(trainer.uid).set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true }),
        db.collection('usuarios').doc(trainer.uid).set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true })
      ]);
    }));
  } else if (isPT) {
    console.log(`   Asignando ${config.trainees.length} alumnos directamente al Personal Trainer...`);
    createdTrainees.push(...await Promise.all(
      config.trainees.map((traineeConf, i) => createTrainee(db, auth, traineeConf, gymUid, i))
    ));
  }

  // 3) Crear ejercicios y asignar rutinas de forma uniforme
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const trainersToProcess: any[] = [...createdTrainers];
  if (isPT && trainersToProcess.length === 0) {
    trainersToProcess.push({
      uid: gymUid,
      nombre: config.gym.nombre,
      plan: config.gym.plan
    });
  }

  for (const trainer of trainersToProcess) {
    console.log(`   Creando ejercicios y rutinas para: ${trainer.nombre}`);
    
    // Si el entrenador es Free o el gimnasio es Free, acotamos los ejercicios creados a un máximo de 10
    const limitExercises = (trainer.plan === 'free' || config.gym.plan === 'free');
    const exercisesToCreate = limitExercises ? config.exercises.slice(0, 10) : config.exercises;

    const trainerExercises = await Promise.all(
      exercisesToCreate.map(exName => createExercise(db, exName, `Descripción detallada de ${exName}`, trainer.uid))
    );

    const trainerDocUpdate = { ejerciciosCreadasIds: trainerExercises };
    if (!isPT || trainer.uid !== gymUid) {
      await Promise.all([
        db.collection('entrenadores').doc(trainer.uid).set(trainerDocUpdate, { merge: true }),
        db.collection('usuarios').doc(trainer.uid).set(trainerDocUpdate, { merge: true })
      ]);
    }

    // Rutinas
    const trainerTrainees = createdTrainees.filter(t => t.trainerUid === trainer.uid);
    const allTrainerRoutines: string[] = [];

    await Promise.all(trainerTrainees.map(async (trainee) => {
      const isFreeUser = trainee.plan === 'free';
      const numRutinas = isFreeUser ? 1 : (Math.floor(Math.random() * 3) + 1);

      const shuffledDays = [...diasSemana].sort(() => 0.5 - Math.random());
      const selectedDays = shuffledDays.slice(0, numRutinas);

      const routineIds: string[] = [];
      
      await Promise.all(selectedDays.map(async (dia) => {
        const routineExercises = [...trainerExercises]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(5, trainerExercises.length));

        const routineName = `Rutina de ${dia} - ${trainee.nombre}`;
        const currentRoutineId = await createRoutine(db, routineName, dia, routineExercises, trainee.uid, trainee.nombre, trainer.uid);
        routineIds.push(currentRoutineId);

        try {
          const asignadaRef = db.collection('rutinas-asignadas').doc();
          const asignadaId = asignadaRef.id;
          await asignadaRef.set({
            id: asignadaId,
            rutinaId: currentRoutineId,
            entrenadoId: trainee.uid,
            entrenadorId: trainer.uid,
            diaSemana: dia,
            fechaAsignacion: Timestamp.now(),
            activa: true
          });
          stats.routinesAssigned++;
        } catch (e) {
          console.warn('⚠️ No se pudo crear rutina-asignada:', e);
        }
      }));

      allTrainerRoutines.push(...routineIds);

      const traineeUpdate = {
        rutinasIds: routineIds,
        rutinasAsignadasIds: routineIds
      };
      
      await Promise.all([
        db.collection('usuarios').doc(trainee.uid).set(traineeUpdate, { merge: true }),
        db.collection('entrenados').doc(trainee.uid).set(traineeUpdate, { merge: true })
      ]);

      if (routineIds.length > 0) {
        await createMockSharedSession(db, trainee.uid, trainee.nombre, routineIds[0], `Rutina de Fuerza - ${trainee.nombre}`);
      }
    }));

    // Actualizar el entrenador consolidadamente una sola vez al final del loop del entrenador
    if (allTrainerRoutines.length > 0) {
      if (!isPT || trainer.uid !== gymUid) {
        const entrenadorRef = db.collection('entrenadores').doc(trainer.uid);
        const snap = await entrenadorRef.get();
        const currentRoutines = snap.data()?.['rutinasCreadasIds'] || [];
        const trainerRoutineUpdate = { rutinasCreadasIds: [...new Set([...currentRoutines, ...allTrainerRoutines])] };
        await Promise.all([
          entrenadorRef.set(trainerRoutineUpdate, { merge: true }),
          db.collection('usuarios').doc(trainer.uid).set(trainerRoutineUpdate, { merge: true })
        ]);
      } else {
        const ptTrainerRef = db.collection('entrenadores').doc(gymUid);
        const snap = await ptTrainerRef.get();
        const currentRoutines = snap.exists ? (snap.data()?.['rutinasCreadasIds'] || []) : [];
        const ptTrainerUpdate = {
          ejerciciosCreadasIds: trainerExercises,
          rutinasCreadasIds: [...new Set([...currentRoutines, ...allTrainerRoutines])]
        };
        await ptTrainerRef.set(ptTrainerUpdate, { merge: true });
      }
    }
  }

  // 4) Crear seguidores/seguidos en memoria (para evitar race conditions y lecturas de db repetitivas)
  console.log('   Estableciendo relaciones de seguimiento...');
  const seguidosMap = new Map<string, Set<string>>();
  const seguidoresMap = new Map<string, Set<string>>();
  
  for (const t of createdTrainees) {
    seguidosMap.set(t.uid, new Set<string>());
    seguidoresMap.set(t.uid, new Set<string>());
  }

  for (let i = 0; i < createdTrainees.length; i++) {
    const currentTrainee = createdTrainees[i];
    const otherTrainees = createdTrainees.filter(t => t.uid !== currentTrainee.uid);
    if (otherTrainees.length > 0) {
      const shuffled = [...otherTrainees].sort(() => 0.5 - Math.random());
      const toFollow = shuffled.slice(0, Math.min(2, shuffled.length));
      
      for (const targetTrainee of toFollow) {
        seguidosMap.get(currentTrainee.uid)!.add(targetTrainee.uid);
        seguidoresMap.get(targetTrainee.uid)!.add(currentTrainee.uid);
      }
    }
  }

  // Escribir todas las relaciones de seguimiento en paralelo
  await Promise.all(createdTrainees.map(async (t) => {
    const seguidos = Array.from(seguidosMap.get(t.uid)!);
    const seguidores = Array.from(seguidoresMap.get(t.uid)!);
    
    await Promise.all([
      db.collection('entrenados').doc(t.uid).set({ seguidos, seguidores }, { merge: true }),
      db.collection('usuarios').doc(t.uid).set({ seguidos, seguidores }, { merge: true })
    ]);
  }));

  // 5) Crear desafíos mocks
  console.log('   Creando desafíos...');
  await Promise.all(config.desafios.map(async (d) => {
    const matchTrainee = createdTrainees.find(t => t.nombre.toLowerCase().replace(/[^a-z0-9]/g, '') === d.creadorId.replace('trainee_', ''));
    const finalCreatorId = matchTrainee ? matchTrainee.uid : d.creadorId;
    const finalCreatorName = matchTrainee ? matchTrainee.nombre : d.creadorNombre;

    await db.collection('desafios').doc(d.id).set({
      ...d,
      creadorId: finalCreatorId,
      creadorNombre: finalCreatorName,
      fechaCreacion: Timestamp.now()
    });
    stats.challengesCreated++;
  }));

  // 6) Crear interacciones/matches mocks
  console.log('   Creando matches fitness y mensajes asociados...');
  await Promise.all(config.matches.map(async (m) => {
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
    stats.matchesCreated++;

    if (m.mutuo) {
      const msgId1 = `msg-seed-1-${m.id}`;
      const msgId2 = `msg-seed-2-${m.id}`;

      await Promise.all([
        db.collection('mensajes').doc(msgId1).set({
          id: msgId1,
          remitenteId: finalSourceId,
          remitenteTipo: 'entrenado',
          destinatarioId: finalDestId,
          destinatarioTipo: 'entrenado',
          contenido: `¡Hola! Vi que nos gusta entrenar en el mismo horario. ¿Te parece si compartimos rutina mañana? 🏋️‍♂️💪`,
          tipo: 'TEXTO',
          leido: false,
          entregado: true,
          fechaEnvio: Timestamp.fromDate(new Date(Date.now() - 3600000))
        }),
        db.collection('mensajes').doc(msgId2).set({
          id: msgId2,
          remitenteId: finalDestId,
          remitenteTipo: 'entrenado',
          destinatarioId: finalSourceId,
          destinatarioTipo: 'entrenado',
          contenido: `¡Totalmente! Nos vemos a las 19:00 cerca de la zona de peso libre.`,
          tipo: 'TEXTO',
          leido: true,
          entregado: true,
          fechaEnvio: Timestamp.now()
        })
      ]);
      stats.messagesCreated += 2;
    }
  }));

  // 6.5) Crear convocatorias fitness
  console.log('   Creando convocatorias fitness...');
  if (createdTrainees.length >= 2) {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    const t1 = createdTrainees[0];
    const convId1 = `conv-${t1.uid}-1`;
    const t2 = createdTrainees[1];
    const convId2 = `conv-${t2.uid}-2`;

    const convPromises = [
      db.collection('convocatorias').doc(convId1).set({
        id: convId1,
        creadorId: t1.uid,
        creadorNombre: t1.nombre,
        creadorFoto: t1.photoURL || null,
        gimnasioId: gymUid,
        fechaCreacion: Timestamp.now(),
        fechaEntrenamiento: Timestamp.fromDate(hoy),
        horaInicio: "19:00",
        horaFin: "20:30",
        mensaje: "¡Hoy toca rutina de tren superior! ¿Alguien me acompaña en la zona de peso libre? 💪🏋️‍♀️",
        interesados: [],
        activo: true
      }),
      db.collection('convocatorias').doc(convId2).set({
        id: convId2,
        creadorId: t2.uid,
        creadorNombre: t2.nombre,
        creadorFoto: t2.photoURL || null,
        gimnasioId: gymUid,
        fechaCreacion: Timestamp.now(),
        fechaEntrenamiento: Timestamp.fromDate(manana),
        horaInicio: "08:00",
        horaFin: "09:30",
        mensaje: "Pecho y bíceps mañana temprano. ¿Quién se une para ayudarnos a sacar las últimas reps al fallo? 🔥",
        interesados: [],
        activo: true
      })
    ];
    stats.convocatoriasCreated += 2;

    if (trainersToProcess.length > 0) {
      const trainer = trainersToProcess[0];
      const convIdOficial = `conv-${trainer.uid}-wod`;
      const convIdOficial2 = `conv-${trainer.uid}-wod2`;

      convPromises.push(
        db.collection('convocatorias').doc(convIdOficial).set({
          id: convIdOficial,
          creadorId: trainer.uid,
          creadorNombre: trainer.nombre,
          creadorFoto: trainer.photoURL || null,
          gimnasioId: gymUid,
          fechaCreacion: Timestamp.now(),
          fechaEntrenamiento: Timestamp.fromDate(hoy),
          horaInicio: "08:00",
          horaFin: "09:30",
          mensaje: "Calentamiento: 5 min movilidad. WOD: AMRAP 20 min de: 5 Pull-ups, 10 Push-ups, 15 Squats. ¡A darlo todo! 🏋️‍♂️🔥",
          interesados: [t1.uid],
          activo: true,
          creadorRol: "entrenador",
          titulo: "WOD del Día: Resistencia Acondicionamiento",
          esOficial: true
        }),
        db.collection('convocatorias').doc(convIdOficial2).set({
          id: convIdOficial2,
          creadorId: trainer.uid,
          creadorNombre: trainer.nombre,
          creadorFoto: trainer.photoURL || null,
          gimnasioId: gymUid,
          fechaCreacion: Timestamp.now(),
          fechaEntrenamiento: Timestamp.fromDate(manana),
          horaInicio: "18:00",
          horaFin: "19:30",
          mensaje: "Entrenamiento de fuerza enfocado en Powerlifting (Peso Muerto y Sentadilla). Técnica y series pesadas.",
          interesados: [],
          activo: true,
          creadorRol: "entrenador",
          titulo: "Clase Especial: Fuerza y Técnica",
          esOficial: true
        })
      );
      stats.convocatoriasCreated += 2;
    }

    await Promise.all(convPromises);
  }

  // 7) Crear Gimnasio / Personal Trainer Central modularizado
  const trainersIds = createdTrainers.map(t => t.uid);
  const traineesIds = createdTrainees.map(t => t.uid);
  
  await createGym(db, auth, config.gym, trainersIds, traineesIds);
}

function printSummaryTable() {
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
    console.log(`🧹 Colecciones Firestore limpiadas: ${stats.collectionsCleared.join(', ')}`);
  }
  console.log("========================================================\n");
}

async function main() {
  const args = process.argv.slice(2);
  const configArg = args.find(arg => arg.startsWith('--config='));
  const configName = configArg ? configArg.split('=')[1] : null;

  const allConfigs: SeedConfig[] = [
    gymFreeAllFreeConfig,
    gymPremiumAllPremiumConfig,
    ptFreeAllFreeConfig,
    ptPremiumAllPremiumConfig
  ];

  if (configName) {
    let selectedConfig = allConfigs.find(c => c.gym.id === configName || configName.replace(/[^a-z0-9]/g, '') === c.gym.nombre.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    if (configName === 'gym-free-all-free') selectedConfig = gymFreeAllFreeConfig;
    if (configName === 'gym-premium-all-premium') selectedConfig = gymPremiumAllPremiumConfig;
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
      'sesiones-rutina', 'desafios', 'matches', 'convocatorias',
      'mensajes'
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

  printSummaryTable();
  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error general en seed:', err);
    process.exit(1);
  });
}
