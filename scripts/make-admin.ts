import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log("\n❌ Error: Por favor, proporciona el email del usuario.");
    console.log("Uso: npx tsx scripts/make-admin.ts usuario@ejemplo.com\n");
    process.exit(1);
  }

  // Buscar serviceAccountKey.json en el directorio de scripts
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.log("\n❌ Error: No se encontró el archivo de credenciales de Firebase.");
    console.log(`Se esperaba el archivo en: ${serviceAccountPath}\n`);
    console.log("Para obtener este archivo:");
    console.log("1. Ve a la Consola de Firebase (https://console.firebase.google.com).");
    console.log("2. Selecciona tu proyecto.");
    console.log("3. Ve a 'Configuración del proyecto' (ícono de engranaje) -> 'Cuentas de servicio'.");
    console.log("4. Haz clic en 'Generar nueva clave privada' y descarga el archivo JSON.");
    console.log(`5. Guarda ese archivo renombrado como 'serviceAccountKey.json' en la carpeta: ${path.dirname(serviceAccountPath)}\n`);
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  console.log(`Conectando a Firebase para el proyecto: ${serviceAccount.project_id}...`);
  initializeApp({
    credential: cert(serviceAccount)
  });

  const auth = getAuth();
  const db = getFirestore();

  try {
    console.log(`Buscando usuario con email: ${email}...`);
    let uid: string;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`Usuario encontrado con UID: ${uid}`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`El usuario no existe en Firebase Authentication. Creándolo con contraseña temporal 'admin123'...`);
        const userRecord = await auth.createUser({
          email: email,
          password: "admin123",
          displayName: "Administrador FTN"
        });
        uid = userRecord.uid;
        console.log(`✅ Usuario creado en Firebase Auth con UID: ${uid}`);
      } else {
        throw authError;
      }
    }

    console.log(`\n🔑 Asignando Custom Claim 'admin: true' al usuario ${uid}...`);
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log("✅ Custom Claim asignado correctamente.");

    console.log(`\n💾 Actualizando rol a 'admin' en la colección 'usuarios' de Firestore...`);
    await db.collection("usuarios").doc(uid).set({
      uid: uid,
      email: email,
      role: "admin",
      nombre: "Administrador FTN",
      fechaActualizacion: Timestamp.now()
    }, { merge: true });
    console.log("✅ Documento de Firestore actualizado correctamente.");
    
    console.log(`\n🎉 ¡Operación completada con éxito! El usuario ${email} ahora es Administrador y tiene acceso a gym-admin.`);
    console.log(`👉 Si el usuario fue creado recientemente, su contraseña temporal es: admin123\n`);
  } catch (error: any) {
    console.error("\n❌ Error al intentar hacer administrador al usuario:", error.message || error);
    process.exit(1);
  }
}

run();
