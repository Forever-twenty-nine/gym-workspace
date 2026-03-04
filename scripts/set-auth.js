const admin = require('firebase-admin');

// Configurar para usar los emuladores
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "default-project"
    });
}

const auth = admin.auth();
const db = admin.firestore();

async function setAuthUser() {
    const email = "entrenador@gym.com";
    const password = "admin123"; // Contraseña por defecto

    console.log(`🔐 Configurando autenticación para ${email}...`);

    try {
        // 1. Buscar el UID en Firestore
        const snapshot = await db.collection("usuarios").where("nombre", "==", "entrenador").get();
        if (snapshot.empty) {
            console.error("❌ No se encontró el usuario en Firestore. Ejecuta el script de semilla primero.");
            process.exit(1);
        }
        const userId = snapshot.docs[0].id;
        console.log(`✅ ID de Firestore encontrado: ${userId}`);

        // 2. Intentar crear o actualizar el usuario en Auth con el MISMO UID
        try {
            await auth.createUser({
                uid: userId,
                email: email,
                password: password,
                displayName: "entrenador"
            });
            console.log(`✨ Usuario Auth creado con éxito.`);
        } catch (e) {
            if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
                console.log(`ℹ️ El usuario ya existe en Auth. Actualizando contraseña...`);
                await auth.updateUser(userId, {
                    password: password
                });
                console.log(`✅ Contraseña actualizada.`);
            } else {
                throw e;
            }
        }

        console.log(`\n🚀 ¡Listo! Puedes entrar con:`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

setAuthUser();
