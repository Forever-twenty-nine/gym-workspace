# 🚀 Guía de Scripts y Datos de Prueba

Este directorio contiene herramientas para facilitar el desarrollo local del proyecto. Aquí encontrarás scripts para limpiar el entorno y generar datos de prueba automáticamente.

---

## 🛠️ Comandos Principales (desde la raíz)

Para que el desarrollo sea más fluido, puedes usar estos comandos desde la carpeta principal del proyecto:

*   `npm run db:seed`: **(El más importante)** Carga usuarios, rutinas y ejercicios en tus emuladores locales para que no tengas que crear todo a mano.
*   `npm run kill-emulators`: ¿Los emuladores no arrancan porque el puerto está ocupado? Este script busca y cierra cualquier proceso que esté bloqueando los puertos de Firebase.

---

## 👥 Cuentas de Prueba (Seed Data)

Al ejecutar `npm run db:seed`, se crean automáticamente las siguientes cuentas en tu entorno local:

### 🏋️ Entrenadores
Cuentas para probar el panel de administración (`gym-admin`):
*   **Email:** `entrenador1@gym.test` | **Password:** `admin123`
*   **Email:** `entrenador2@gym.test` | **Password:** `admin123`
*   **Email:** `entrenador3@gym.test` | **Password:** `admin123`

### 🤸 Entrenados (Alumnos)
Cuentas para probar la aplicación móvil (`gym-app`):
*   **Email:** `entrenado1@gym.test` | **Password:** `user123` (Asignado al Entrenador 1)
*   **Email:** `entrenado2@gym.test` | **Password:** `user123` (Asignado al Entrenador 2)
*   **Email:** `entrenado3@gym.test` | **Password:** `user123` (Asignado al Entrenador 3)

> **Nota:** Cada alumno ya viene con **3 rutinas configuradas** (Lunes, Miércoles y Viernes) y una lista de ejercicios para que puedas ver la App funcionando desde el primer segundo.

---

## 🔍 Cómo ver los datos
Si quieres ver los datos que se han creado, abre en tu navegador la **Suite de Emuladores de Firebase**:
👉 [http://localhost:4000](http://localhost:4000)

Desde ahí podrás inspeccionar:
*   **Authentication**: Todos los usuarios creados.
*   **Firestore**: Las colecciones de usuarios, rutinas, ejercicios y entrenados.

---

## ⚠️ Recordatorio importante
Estos scripts están diseñados **exclusivamente para el entorno de desarrollo local**. Nunca los uses contra la base de datos de producción, ya que borrarán o modificarán datos reales.
