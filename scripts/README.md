# 🚀 Guía de Scripts y Datos de Prueba

Este directorio contiene herramientas para facilitar el desarrollo local del proyecto. Aquí encontrarás scripts para limpiar el entorno y generar datos de prueba automáticamente.

---

## 🛠️ Comandos Principales (desde la raíz)

Para que el desarrollo sea más fluido, puedes usar estos comandos desde la carpeta principal del proyecto:

*   `npm run db:seed`: **(El más importante)** Carga usuarios, rutinas y ejercicios en tus emuladores locales para que no tengas que crear todo a mano.
*   `npm run kill-emulators`: ¿Los emuladores no arrancan porque el puerto está ocupado? Este script busca y cierra cualquier proceso que esté bloqueando los puertos de Firebase.

---

## 👥 Cuentas de Prueba (Seed Data)

Al ejecutar `npm run db:seed`, se crean automáticamente las siguientes cuentas con datos realistas en tu entorno local:

### 🏋️ Entrenadores
Cuentas para probar el panel de administración (`gym-admin`):
*   **Email:** `carlos.rod@gym.test` | **Password:** `admin123` (Carlos Rodríguez)
*   **Email:** `ana.mtz@gym.test` | **Password:** `admin123` (Ana Martínez)
*   **Email:** `roberto.snz@gym.test` | **Password:** `admin123` (Roberto Sánchez)

### 🤸 Entrenados (Alumnos) - Listado Completo
Se han creado **15 alumnos** (5 por cada entrenador). Password para todos: `user123`

| Entrenador Responsable | Alumno (Email) |
| :--- | :--- |
| **Carlos Rodríguez** | `juan.perez@gym.test`, `maria.garcia@gym.test`, `luis.fernandez@gym.test`, `elena.lopez@gym.test`, `diego.torres@gym.test` |
| **Ana Martínez** | `sofia.ruiz@gym.test`, `javier.castro@gym.test`, `lucia.morales@gym.test`, `andres.gil@gym.test`, `carmen.ortiz@gym.test` |
| **Roberto Sánchez** | `fernando.vega@gym.test`, `isabel.medina@gym.test`, `ricardo.silva@gym.test`, `patricia.ramos@gym.test`, `hugo.navarro@gym.test` |

> **Nota:** Cada alumno tiene asignadas entre **1 y 3 rutinas semanales aleatorias**, con ejercicios reales (25 disponibles por entrenador).

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
