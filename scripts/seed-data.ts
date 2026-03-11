import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { Objetivo } from "../projects/gym-library/src/lib/enums/objetivo.enum";

// Forzar emuladores en desarrollo
process.env['FIRESTORE_EMULATOR_HOST'] = process.env['FIRESTORE_EMULATOR_HOST'] || "127.0.0.1:8080";
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = process.env['FIREBASE_AUTH_EMULATOR_HOST'] || "127.0.0.1:9099";

initializeApp({ projectId: "demo-gym" });

const auth = getAuth();
const db = getFirestore();

async function ensureAuthUser(uid: string, email: string, password = "changeme123", displayName?: string) {
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
}

async function createTrainer(name: string, email: string, password: string) {
    const usuariosRef = db.collection('usuarios');
    // Use deterministic uid when provided via name -> slug, to make seed idempotent
    const uid = `trainer_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const trainerUserData = {
        uid,
        nombre: name,
        email,
        role: 'entrenador',
        plan: 'free',
        onboarded: true,
        fechaCreacion: Timestamp.now(),
        fechaRegistro: Timestamp.now()
    };

    // write usuario doc with fixed id
    const docRef = usuariosRef.doc(uid);
    await docRef.set(trainerUserData, { merge: true });
    await ensureAuthUser(uid, email, password, name);

    // Ensure entrenador doc exists and is synced with usuario
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

async function createTrainee(name: string, email: string, password: string, trainerUid: string) {
    const usuariosRef = db.collection('usuarios');
    // deterministic uid for trainees
    const uid = `trainee_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const objetivos = [Objetivo.VOLUMEN, Objetivo.DEFINICION, Objetivo.FUERZA, Objetivo.SALUD];
    const objetivoAleatorio = objetivos[Math.floor(Math.random() * objetivos.length)];

    const traineeUserData = {
        uid,
        nombre: name,
        email,
        role: 'entrenado',
        plan: 'free',
        onboarded: true,
        objetivo: objetivoAleatorio,
        fechaCreacion: Timestamp.now()
    };

    const docRef = usuariosRef.doc(uid);
    await docRef.set(traineeUserData, { merge: true });
    await ensureAuthUser(uid, email, password, name);

    // Crear/Sincronizar en la colección 'entrenados' (IMPORTANTE para la app)
    const entrenadosRef = db.collection('entrenados').doc(uid);
    await entrenadosRef.set({
        id: uid,
        objetivo: objetivoAleatorio,
        entrenadoresId: [trainerUid],
        rutinasAsignadasIds: [],
        fechaRegistro: Timestamp.now()
    }, { merge: true });

    // update entrenador docs to include this trainee
    try {
        const entrenadorRef = db.collection('entrenadores').doc(trainerUid);
        const entrenadorSnap = await entrenadorRef.get();
        const entrenadorData = entrenadorSnap.exists ? (entrenadorSnap.data() as Record<string, any>) : {};
        const existing = entrenadorData['entrenadosAsignadosIds'] || [];
        if (!existing.includes(uid)) {
            await entrenadorRef.set({ entrenadosAsignadosIds: [...new Set([...existing, uid])] }, { merge: true });
        }

        // also mirror into usuarios document for trainer
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

    return { ...traineeUserData };
}

async function createExercise(nombre: string, descripcion: string, entrenadorId?: string) {
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
    await ref.update({ id }); // Sincronizar campo id dentro del documento
    return id;
}

async function createRoutine(nombre: string, dia: string, ejerciciosIds: string[], usuarioId: string, nombreUsuario: string, entrenadorId?: string) {
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
    const docRef = db.collection('rutinas').doc(); // Auto-generar ID
    const id = docRef.id;
    await docRef.set({ ...data, id });
    console.log(`✅ Rutina creada en Firestore con ID: ${id}`);
    return id;
}

async function main() {
    console.log('🚀 Seed: creando 3 entrenadores, 3 entrenados y rutinas (Emulador)');

    // Limpieza rápida: eliminar documentos con role 'gimnasio' si existen
    try {
        const gimnasiosSnap = await db.collection('usuarios').where('role', '==', 'gimnasio').get();
        if (!gimnasiosSnap.empty) {
            console.log(`🧹 Eliminando ${gimnasiosSnap.size} usuario(s) con role 'gimnasio'`);
            for (const d of gimnasiosSnap.docs) {
                await db.collection('usuarios').doc(d.id).delete();
                // intentar también eliminar en auth si existe
                try { await auth.deleteUser(d.id); } catch (_) { /* ignore */ }
            }
        }
    } catch (e) {
        console.warn('⚠️ Error durante limpieza de usuarios gimnasio:', e);
    }

    // Datos por defecto
    const trainers = [
        { name: 'Carlos Rodríguez', email: 'carlos.rod@gym.test', password: 'admin123' },
        { name: 'Ana Martínez', email: 'ana.mtz@gym.test', password: 'admin123' },
        { name: 'Roberto Sánchez', email: 'roberto.snz@gym.test', password: 'admin123' }
    ];

    const traineePool = [
        { name: 'Juan Pérez', email: 'juan.perez@gym.test' },
        { name: 'María García', email: 'maria.garcia@gym.test' },
        { name: 'Luis Fernández', email: 'luis.fernandez@gym.test' },
        { name: 'Elena López', email: 'elena.lopez@gym.test' },
        { name: 'Diego Torres', email: 'diego.torres@gym.test' },
        { name: 'Sofía Ruiz', email: 'sofia.ruiz@gym.test' },
        { name: 'Javier Castro', email: 'javier.castro@gym.test' },
        { name: 'Lucía Morales', email: 'lucia.morales@gym.test' },
        { name: 'Andrés Gil', email: 'andres.gil@gym.test' },
        { name: 'Carmen Ortiz', email: 'carmen.ortiz@gym.test' },
        { name: 'Fernando Vega', email: 'fernando.vega@gym.test' },
        { name: 'Isabel Medina', email: 'isabel.medina@gym.test' },
        { name: 'Ricardo Silva', email: 'ricardo.silva@gym.test' },
        { name: 'Patricia Ramos', email: 'patricia.ramos@gym.test' },
        { name: 'Hugo Navarro', email: 'hugo.navarro@gym.test' }
    ];

    // 1) Crear entrenadores
    const createdTrainers: any[] = [];
    for (const t of trainers) {
        const created = await createTrainer(t.name, t.email, t.password);
        createdTrainers.push(created);
    }

    // 2) Crear entrenados (5 por entrenador)
    const createdTrainees: any[] = [];
    let traineeIdx = 0;
    for (const trainer of createdTrainers) {
        const trainerAssignedIds: string[] = [];
        for (let i = 0; i < 5; i++) {
            const tr = traineePool[traineeIdx++];
            const created = await createTrainee(tr.name, tr.email, 'user123', trainer.uid);
            createdTrainees.push(created);
            trainerAssignedIds.push(created.uid);
        }

        // actualizar entrenador: añadir entrenados a entrenadosAsignadosIds
        const entrenadorRef = db.collection('entrenadores').doc(trainer.uid);
        await entrenadorRef.set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true });

        // También actualizar el documento del entrenador en la colección `usuarios`
        try {
            const usuarioTrainerRef = db.collection('usuarios').doc(trainer.uid);
            await usuarioTrainerRef.set({ entrenadosAsignadosIds: trainerAssignedIds }, { merge: true });
        } catch (uErr) {
            console.warn('⚠️ No se pudo actualizar usuario entrenador en `usuarios`:', uErr);
        }
    }

    // 3) Crear 25 ejercicios reales por entrenador y luego asignar rutinas aleatorias
    const realGymExercises = [
        "Sentadilla con Barra", "Press de Banca", "Peso Muerto", "Dominadas", "Press Militar",
        "Curl de Bíceps con Mancuerna", "Tríceps en Polea Alta", "Zancadas", "Remo con Barra", "Prensa de Piernas",
        "Elevaciones Laterales", "Press Inclinado", "Fondos de Pecho", "Copa de Tríceps", "Curl Martillo",
        "Extensión de Cuádriceps", "Curl Femoral", "Elevación de Talones", "Plancha Abdominal", "Abdominales en Polea",
        "Aperturas con Mancuerna", "Face Pull", "Remo al Mentón", "Hip Thrust", "Pajaros/Elevación Posterior"
    ];

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (const trainer of createdTrainers) {
        console.log(`📦 Creando 25 ejercicios para entrenador: ${trainer.nombre}`);
        const trainerExercises: string[] = [];
        for (const exName of realGymExercises) {
            const exId = await createExercise(exName, `Descripción detallada de ${exName}`, trainer.uid);
            trainerExercises.push(exId);
        }

        // Actualizar entrenador con sus ejercicios
        const trainerDocUpdate = { ejerciciosCreadasIds: trainerExercises };
        await db.collection('entrenadores').doc(trainer.uid).set(trainerDocUpdate, { merge: true });
        await db.collection('usuarios').doc(trainer.uid).set(trainerDocUpdate, { merge: true });

        // Asignar rutinas aleatorias a cada entrenado del entrenador (máx 3 rutinas por semana)
        const trainerTrainees = createdTrainees.filter(t => t.role === 'entrenado'); // Cambio aquí para filtrar correctamente
        for (const trainee of trainerTrainees) {
            const numRutinas = Math.floor(Math.random() * 3) + 1; // 1 a 3 rutinas
            const shuffledDays = [...diasSemana].sort(() => 0.5 - Math.random());
            const selectedDays = shuffledDays.slice(0, numRutinas);

            const routineIds: string[] = [];
            for (const dia of selectedDays) {
                // Seleccionar 5 ejercicios aleatorios de los 25 del entrenador
                const routineExercises = [...trainerExercises].sort(() => 0.5 - Math.random()).slice(0, 5);

                const routineName = `Rutina de ${dia} - ${trainee.nombre}`;
                const currentRoutineId = await createRoutine(routineName, dia, routineExercises, trainee.uid, trainee.nombre, trainer.uid);
                routineIds.push(currentRoutineId);

                // Crear registro en 'rutinas-asignadas'
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

            // Actualizar entrenado con sus rutinas
            const traineeUpdate = {
                rutinasIds: routineIds,
                rutinasAsignadasIds: routineIds
            };
            await db.collection('usuarios').doc(trainee.uid).set(traineeUpdate, { merge: true });
            await db.collection('entrenados').doc(trainee.uid).set(traineeUpdate, { merge: true });

            // También añadir estas rutinas a las creadas por el entrenador
            const entrenadorRef = db.collection('entrenadores').doc(trainer.uid);
            const snap = await entrenadorRef.get();
            const currentRoutines = snap.data()?.['rutinasCreadasIds'] || [];
            const trainerRoutineUpdate = { rutinasCreadasIds: [...new Set([...currentRoutines, ...routineIds])] };
            await entrenadorRef.set(trainerRoutineUpdate, { merge: true });
            await db.collection('usuarios').doc(trainer.uid).set(trainerRoutineUpdate, { merge: true });
        }
    }

    console.log('✅ Seed completado con éxito.');

    process.exit(0);
}

main().catch(err => { console.error('❌ Error seed:', err); process.exit(1); });
