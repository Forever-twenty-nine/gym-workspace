Seed scripts

Este directorio contiene scripts para sembrar datos en el emulador de Firebase.

scripts/seed-data.ts
- Script TypeScript (recomendado). Crea 3 entrenadores, 3 entrenados (cada entrenado asignado a un entrenador distinto) y para cada entrenado 3 rutinas (Lunes, Miércoles, Viernes) con 5 ejercicios únicos por rutina. También crea usuarios en Auth (emulador) con UID igual al id de Firestore.

Ejecución (usar emuladores):

# Recomendado: ejecutar con ts-node
npx ts-node scripts/seed-data.ts

# Alternativa: compilar y ejecutar
npx tsc scripts/seed-data.ts --outDir dist && node dist/scripts/seed-data.js

Notas:
- El script fuerza `FIRESTORE_EMULATOR_HOST` y `FIREBASE_AUTH_EMULATOR_HOST` a `127.0.0.1:8080` y `127.0.0.1:9099` si no están definidos.
- Está diseñado para entornos de desarrollo con los emuladores.

Credenciales generadas por defecto
--------------------------------
Al ejecutar `scripts/seed-data.ts` contra el emulador, el script crea los siguientes usuarios (email / password) para pruebas:

- Entrenadores:
	- entrenador1@gym.test — admin123
	- entrenador2@gym.test — admin123
	- entrenador3@gym.test — admin123
- Entrenados:
	- entrenado1@gym.test — user123
	- entrenado2@gym.test — user123
	- entrenado3@gym.test — user123

Comandos útiles
---------------
- Iniciar la app en modo desarrollo (conexión a emuladores si está configurado):
```powershell
cd c:\repositorios\gym-workspace
npm run start
```

- Obtener un token de inicio de sesión desde el Auth Emulator (ejemplo curl):
```bash
curl 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=any' \
 -H 'Content-Type: application/json' \
 --data '{"email":"entrenador1@gym.test","password":"admin123","returnSecureToken":true}'
```

- Listar/inspeccionar usuarios con Admin SDK (Node):
```js
// node
const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
admin.initializeApp({projectId:'default-project'});
admin.auth().listUsers(1000).then(r => console.log(r.users.map(u=>({email:u.email,uid:u.uid}))))
.catch(console.error);
```

- UI del Emulator Suite: abre `http://localhost:4000` y navega a la sección `Authentication` para ver los usuarios creados.

Notas de seguridad
-----------------
- Estos usuarios y contraseñas son solo para desarrollo/emulador. No los uses en producción.
- No subas las claves reales de Firebase al repositorio.

