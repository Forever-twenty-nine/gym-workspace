import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Configurar para usar el emulador
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

const app = initializeApp({
    projectId: "gym-app-39fb6" // ID del proyecto de firebase.json si es necesario
});

const db = getFirestore();

async function seedData() {
    console.log("🚀 Iniciando siembra de datos...");

    try {
        // 1. Buscar al usuario "entrenador"
        const usuariosRef = db.collection("usuarios");
        const snapshot = await usuariosRef.where("nombre", "==", "entrenador").get();

        if (snapshot.empty) {
            console.error("❌ No se encontró un usuario con el nombre 'entrenador'. Por favor, créalo primero.");
            return;
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;
        console.log(`✅ Usuario 'entrenador' encontrado (ID: ${userId})`);

        // 2. Generar 25 ejercicios
        console.log("🏋️  Generando 25 ejercicios...");
        const ejerciciosIds: string[] = [];
        const ejerciciosRef = db.collection("ejercicios");

        for (let i = 1; i <= 25; i++) {
            const ejercicioData = {
                nombre: `Ejercicio Cruzado ${i}`,
                descripcion: `Descripción detallada del ejercicio cruzado número ${i} para el entrenamiento intensivo.`,
                series: Math.floor(Math.random() * 3) + 3, // 3-5 series
                repeticiones: Math.floor(Math.random() * 5) + 8, // 8-12 reps
                peso: Math.floor(Math.random() * 20) + 10, // 10-30 kg
                fechaCreacion: Timestamp.now(),
                fechaModificacion: Timestamp.now()
            };
            const docRef = await ejerciciosRef.add(ejercicioData);
            ejerciciosIds.push(docRef.id);
            if (i % 5 === 0) console.log(`   - ${i} ejercicios creados...`);
        }

        // 3. Generar 5 rutinas (5 ejercicios por rutina)
        console.log("📋 Generando 5 rutinas...");
        const rutinasIds: string[] = [];
        const rutinasRef = db.collection("rutinas");

        for (let i = 1; i <= 5; i++) {
            // Tomar 5 ejercicios para esta rutina (repartiendo los 25 creados)
            const startIndex = (i - 1) * 5;
            const routineExercises = ejerciciosIds.slice(startIndex, startIndex + 5);

            const rutinaData = {
                nombre: `Rutina Diaria ${i}`,
                activa: true,
                descripcion: `Rutina de entrenamiento número ${i} que incluye 5 ejercicios cruzados seleccionados.`,
                ejerciciosIds: routineExercises,
                fechaCreacion: Timestamp.now(),
                fechaModificacion: Timestamp.now(),
                usuarioId: userId,
                nombreUsuario: "entrenador"
            };

            const docRef = await rutinasRef.add(rutinaData);
            rutinasIds.push(docRef.id);
            console.log(`   - Rutina '${rutinaData.nombre}' creada con IDs: ${routineExercises.join(", ")}`);
        }

        // 4. Actualizar el documento del entrenador
        console.log("👤 Actualizando perfil del entrenador...");
        const entrenadorRef = db.collection("entrenadores").doc(userId);

        // Obtenemos el documento actual si existe para no sobreescribir otros datos
        const entrenadorSnap = await entrenadorRef.get();
        let currentExercises: string[] = [];
        let currentRoutines: string[] = [];

        if (entrenadorSnap.exists) {
            const data = entrenadorSnap.data();
            currentExercises = data?.ejerciciosCreadasIds || [];
            currentRoutines = data?.rutinasCreadasIds || [];
        }

        await entrenadorRef.set({
            id: userId,
            fechaRegistro: entrenadorSnap.exists ? (entrenadorSnap.data()?.fechaRegistro || Timestamp.now()) : Timestamp.now(),
            ejerciciosCreadasIds: [...new Set([...currentExercises, ...ejerciciosIds])],
            rutinasCreadasIds: [...new Set([...currentRoutines, ...rutinasIds])],
            entrenadosAsignadosIds: entrenadorSnap.exists ? (entrenadorSnap.data()?.entrenadosAsignadosIds || []) : []
        }, { merge: true });

        console.log("✨ ¡Datos sembrados exitosamente!");
        console.log(`   - Ejercicios nuevos: ${ejerciciosIds.length}`);
        console.log(`   - Rutinas nuevas: ${rutinasIds.length}`);

    } catch (error) {
        console.error("❌ Error durante la siembra de datos:", error);
    }
}

seedData();
