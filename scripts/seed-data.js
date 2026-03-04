const admin = require('firebase-admin');

// Configurar para usar el emulador ANTES de inicializar
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

console.log("🔍 Conectando al emulador Firestore en:", process.env.FIRESTORE_EMULATOR_HOST);

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "default-project"
    });
}

const db = admin.firestore();

async function createAndSeed() {
    console.log("🚀 Iniciando creación de usuario y siembra de datos...");

    try {
        const usuariosRef = db.collection("usuarios");

        // 1. Verificar si ya existe el usuario "entrenador"
        console.log("🔍 Buscando usuario 'entrenador'...");
        const snapshot = await usuariosRef.where("nombre", "==", "entrenador").get();

        let userId;

        if (snapshot.empty) {
            console.log("🏠 No encontrado. Creando usuario 'entrenador'...");
            const newUser = {
                nombre: "entrenador",
                email: "entrenador@gym.com",
                role: "entrenador",
                onboarded: true,
                plan: "premium",
                fechaCreacion: admin.firestore.Timestamp.now()
            };
            const userDoc = await usuariosRef.add(newUser);
            userId = userDoc.id;
            console.log(`✅ Usuario 'entrenador' creado (ID: ${userId})`);
        } else {
            userId = snapshot.docs[0].id;
            console.log(`✅ Usuario 'entrenador' ya existe (ID: ${userId})`);
        }

        // 2. Generar 25 ejercicios
        console.log("🏋️  Generando 25 ejercicios...");
        const ejerciciosIds = [];
        const ejerciciosRef = db.collection("ejercicios");

        for (let i = 1; i <= 25; i++) {
            const ejercicioData = {
                nombre: `Ejercicio Cruzado ${i}`,
                descripcion: `Descripción detallada del ejercicio cruzado número ${i} para el entrenamiento intensivo.`,
                series: Math.floor(Math.random() * 3) + 3,
                repeticiones: Math.floor(Math.random() * 5) + 8,
                peso: Math.floor(Math.random() * 20) + 10,
                fechaCreacion: admin.firestore.Timestamp.now(),
                fechaModificacion: admin.firestore.Timestamp.now()
            };
            const docRef = await ejerciciosRef.add(ejercicioData);
            ejerciciosIds.push(docRef.id);
            if (i % 5 === 0) console.log(`   - ${i} ejercicios creados...`);
        }

        // 3. Generar 5 rutinas (5 ejercicios por rutina)
        console.log("📋 Generando 5 rutinas...");
        const rutinasIds = [];
        const rutinasRef = db.collection("rutinas");

        for (let i = 1; i <= 5; i++) {
            const startIndex = (i - 1) * 5;
            const routineExercises = ejerciciosIds.slice(startIndex, startIndex + 5);

            const rutinaData = {
                nombre: `Rutina Diaria ${i}`,
                activa: true,
                descripcion: `Rutina de entrenamiento número ${i} que incluye 5 ejercicios cruzados seleccionados.`,
                ejerciciosIds: routineExercises,
                fechaCreacion: admin.firestore.Timestamp.now(),
                fechaModificacion: admin.firestore.Timestamp.now(),
                usuarioId: userId,
                nombreUsuario: "entrenador"
            };

            const docRef = await rutinasRef.add(rutinaData);
            rutinasIds.push(docRef.id);
            console.log(`   - Rutina '${rutinaData.nombre}' creada.`);
        }

        // 4. Actualizar el documento del entrenador
        console.log("👤 Actualizando perfil del entrenador...");
        const entrenadorRef = db.collection("entrenadores").doc(userId);

        const entrenadorSnap = await entrenadorRef.get();
        let currentExercises = [];
        let currentRoutines = [];

        if (entrenadorSnap.exists) { // Corregido: .exists es una propiedad
            const data = entrenadorSnap.data();
            currentExercises = data.ejerciciosCreadasIds || [];
            currentRoutines = data.rutinasCreadasIds || [];
        }

        await entrenadorRef.set({
            id: userId,
            fechaRegistro: entrenadorSnap.exists ? (entrenadorSnap.data().fechaRegistro || admin.firestore.Timestamp.now()) : admin.firestore.Timestamp.now(),
            ejerciciosCreadasIds: [...new Set([...currentExercises, ...ejerciciosIds])],
            rutinasCreadasIds: [...new Set([...currentRoutines, ...rutinasIds])],
            entrenadosAsignadosIds: entrenadorSnap.exists ? (entrenadorSnap.data().entrenadosAsignadosIds || []) : []
        }, { merge: true });

        console.log("✨ ¡Datos sembrados exitosamente!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error durante la operación:", error);
        process.exit(1);
    }
}

createAndSeed();
