import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Forzar emuladores en desarrollo
process.env['FIRESTORE_EMULATOR_HOST'] = process.env['FIRESTORE_EMULATOR_HOST'] || "127.0.0.1:8080";
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = process.env['FIREBASE_AUTH_EMULATOR_HOST'] || "127.0.0.1:9099";

initializeApp({ projectId: "default-project" });

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

    const trainerData = {
        nombre: name,
        email,
        role: 'entrenador',
        id: uid,
        plan: 'free',
        onboarded: true,
        fechaCreacion: Timestamp.now()
    };

    // write usuario doc with fixed id
    const docRef = usuariosRef.doc(uid);
    await docRef.set(trainerData, { merge: true });
    await ensureAuthUser(uid, email, password, name);

    // Ensure entrenador doc exists and is synced with usuario
    const entrenadoresRef = db.collection('entrenadores').doc(uid);
    await entrenadoresRef.set({ id: uid, nombre: name, fechaRegistro: Timestamp.now(), ejerciciosCreadasIds: [], rutinasCreadasIds: [], entrenadosAsignadosIds: [] }, { merge: true });

    return { uid, ...trainerData };
}

async function createTrainee(name: string, email: string, password: string, trainerUid: string) {
        const usuariosRef = db.collection('usuarios');
        // deterministic uid for trainees
        const uid = `trainee_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        const traineeData = {
                nombre: name,
                email,
                role: 'entrenado',
                id: uid,
                entrenadoresId: [trainerUid],
                plan: 'free',
                objetivo: 'bajar de peso',
                entrenadorId: trainerUid,
                onboarded: true,
                fechaCreacion: Timestamp.now()
        };

        const docRef = usuariosRef.doc(uid);
        await docRef.set(traineeData, { merge: true });
        await ensureAuthUser(uid, email, password, name);

        // Crear/Sincronizar en la colección 'entrenados' (IMPORTANTE para la app)
        const entrenadosRef = db.collection('entrenados').doc(uid);
        await entrenadosRef.set({ 
            ...traineeData, 
            id: uid, 
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

        return { uid, ...traineeData };
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
        data.entrenadorId = entrenadorId; // Algunos componentes pueden buscar este campo
    }
    const ref = await db.collection('ejercicios').add(data);
    const id = ref.id;
    await ref.update({ id }); // Sincronizar campo id dentro del documento
    return id;
}

async function createRoutine(nombre: string, dia: string, ejerciciosIds: string[], usuarioId: string, nombreUsuario: string, entrenadorId?: string) {
    const data: any = {
        nombre,
        dia,
        active: true,
        descripcion: `Rutina ${nombre} - dia ${dia}`,
        ejerciciosIds,
        fechaCreacion: Timestamp.now(),
        fechaModificacion: Timestamp.now(),
        usuarioId,
        nombreUsuario,
        id: "" // temporal
    };
    if (entrenadorId) {
        data.creadorId = entrenadorId;
        data.entrenadorId = entrenadorId;
    }
    const ref = await db.collection('rutinas').add(data);
    const id = ref.id;
    await ref.update({ id });
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
        { name: 'Entrenador Uno', email: 'entrenador1@gym.test', password: 'admin123' },
        { name: 'Entrenador Dos', email: 'entrenador2@gym.test', password: 'admin123' },
        { name: 'Entrenador Tres', email: 'entrenador3@gym.test', password: 'admin123' }
    ];

    const trainees = [
        { name: 'Entrenado Uno', email: 'entrenado1@gym.test', password: 'user123' },
        { name: 'Entrenado Dos', email: 'entrenado2@gym.test', password: 'user123' },
        { name: 'Entrenado Tres', email: 'entrenado3@gym.test', password: 'user123' }
    ];

    // 1) Crear entrenadores
    const createdTrainers: any[] = [];
    for (const t of trainers) {
        const created = await createTrainer(t.name, t.email, t.password);
        createdTrainers.push(created);
    }

    // 2) Crear entrenados y asignar a cada entrenador distinto
    const createdTrainees: any[] = [];
        for (let i = 0; i < trainees.length; i++) {
        const tr = trainees[i];
        const trainerUid = createdTrainers[i].uid;
        const created = await createTrainee(tr.name, tr.email, tr.password, trainerUid);
        createdTrainees.push(created);

        // actualizar entrenador: añadir entrenado a entrenadosAsignadosIds
        const entrenadorRef = db.collection('entrenadores').doc(trainerUid);
        await entrenadorRef.set({ entrenadosAsignadosIds: [created.uid] }, { merge: true });
                // También actualizar el documento del entrenador en la colección `usuarios` para que sea visible desde allí
                try {
                    const usuarioTrainerRef = db.collection('usuarios').doc(trainerUid);
                    const usuarioSnap = await usuarioTrainerRef.get();
                    const usuarioData = usuarioSnap.exists ? (usuarioSnap.data() as Record<string, any>) : {};
                    const existingAssigned: string[] = usuarioData['entrenadosAsignadosIds'] || [];
                    await usuarioTrainerRef.set({ entrenadosAsignadosIds: [...new Set([...existingAssigned, created.uid])] }, { merge: true });
                } catch (uErr) {
                    console.warn('⚠️ No se pudo actualizar usuario entrenador en `usuarios`:', uErr);
                }
    }

    // 3) Para cada entrenado, crear 3 rutinas (Lunes, Miércoles, Viernes) con 5 ejercicios únicos cada una
    const dias = ['Lunes', 'Miércoles', 'Viernes'];

    for (const trainee of createdTrainees) {
        const rutinaIds: string[] = [];
        const entrenadorUid = trainee.entrenadorId;
        const ejIdsParaEntrenador: string[] = [];

        for (const dia of dias) {
            // crear 5 ejercicios únicos
            const ejerciciosIds: string[] = [];
            for (let e = 1; e <= 5; e++) {
                const nombre = `${trainee.nombre} - Ejercicio ${dia} #${e}`;
                const descripcion = `Ejercicio para ${trainee.nombre} en ${dia} #${e}`;
                const exId = await createExercise(nombre, descripcion, entrenadorUid);
                ejerciciosIds.push(exId);
                ejIdsParaEntrenador.push(exId);
            }

            const rutinaNombre = `${trainee.nombre} - Rutina ${dia}`;
            const rutinaId = await createRoutine(rutinaNombre, dia, ejerciciosIds, trainee.uid, trainee.nombre, entrenadorUid);
            rutinaIds.push(rutinaId);

            // Crear registro en 'rutinas-asignadas' para que la app lo muestre como asignada
            try {
                const asignadaRef = await db.collection('rutinas-asignadas').add({
                    rutinaId,
                    entrenadoId: trainee.uid,
                    entrenadorId: entrenadorUid,
                    diaSemana: dia,
                    fechaAsignacion: Timestamp.now(),
                    activa: true
                });
                await asignadaRef.update({ id: asignadaRef.id });
            } catch (e) {
                console.warn('⚠️ No se pudo crear rutina-asignada:', e);
            }
        }

        // actualizar documento del entrenado
        const traineeUpdate = { 
            rutinasIds: rutinaIds,
            rutinasAsignadasIds: rutinaIds // Campo que la app usa para filtrar en RutinasPage
        };
        await db.collection('usuarios').doc(trainee.uid).set(traineeUpdate, { merge: true });
        await db.collection('entrenados').doc(trainee.uid).set(traineeUpdate, { merge: true });

        // actualizar entrenador: añadir rutinas y ejercicios creados
        const entrenadorRef = db.collection('entrenadores').doc(entrenadorUid);
        const entrenadorSnap = await entrenadorRef.get();
        const entrenadorData = entrenadorSnap.exists ? (entrenadorSnap.data() as Record<string, any>) : undefined;
        
        const existingRutinas: string[] = entrenadorData ? (entrenadorData['rutinasCreadasIds'] || []) : [];
        const existingEjercicios: string[] = entrenadorData ? (entrenadorData['ejerciciosCreadasIds'] || []) : [];
        
        const updateData = { 
            rutinasCreadasIds: [...new Set([...existingRutinas, ...rutinaIds])],
            ejerciciosCreadasIds: [...new Set([...existingEjercicios, ...ejIdsParaEntrenador])]
        };

        await entrenadorRef.set(updateData, { merge: true });
        
        // También reflejar en el documento `usuarios` del entrenador
        try {
            const usuarioTrainerRef = db.collection('usuarios').doc(entrenadorUid);
            await usuarioTrainerRef.set(updateData, { merge: true });
        } catch (uErr) {
            console.warn('⚠️ No se pudo actualizar rutinas/ejercicios en usuario entrenador:', uErr);
        }
    }

    console.log('✅ Seed completado:');
    console.log('  - Entrenadores creados:', createdTrainers.map(t => ({ uid: t.uid, nombre: t.nombre, email: t.email })));
    console.log('  - Entrenados creados:', createdTrainees.map(t => ({ uid: t.uid, nombre: t.nombre, entrenadorId: t.entrenadorId })));

    process.exit(0);
}

main().catch(err => { console.error('❌ Error seed:', err); process.exit(1); });
