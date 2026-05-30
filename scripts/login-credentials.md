# Credenciales para Pruebas de Login (Base de Datos Unificada)

Este documento detalla las credenciales de correo y contraseña generadas de forma simultánea al inicializar los datos del proyecto.

> [!IMPORTANT]
> **Base de Datos Unificada y Poblada de Una Sola Vez**:
> Al ejecutar el comando de seed, se limpia por completo la base de datos de desarrollo y **se inyectan todos los perfiles de gimnasios y Personal Trainers simultáneamente**.
> No necesitas cambiar de perfil ni correr comandos aislados; **todas las cuentas listadas abajo están creadas y activas al mismo tiempo en el sistema**.

---

## 🚀 Cómo Inicializar y Poblar Todo
Abre tu consola en la raíz del proyecto y ejecuta el comando estándar:

```bash
npm run db:seed
```
*(Este comando limpiará todo el emulador local e inyectará de una sola pasada los 6 perfiles completos de prueba)*

---

## 🔑 Regla General de Contraseñas
* **Gimnasios, Entrenadores y Personal Trainers**: `admin123`
* **Entrenados (Alumnos / Atletas)**: `user123`

---

## 🏛️ 1. Perfiles de Gimnasio (Disponibles simultáneamente)

### A. Gimnasio Free (Gimnasio Comunitario)
* **Gimnasio (Admin)**: `comunitario@gym.test` / `admin123`
* **Entrenadores**:
  * `juan.free@gym.test` / `admin123`
  * `maria.free@gym.test` / `admin123`
* **Alumnos (Free)**:
  * `lucas.principiante@gym.test` / `user123` (Nivel Principiante)
  * `pedro.intermedio@gym.test` / `user123` (Nivel Intermedio)
  * `tomas.avanzado@gym.test` / `user123` (Nivel Avanzado)

### B. Gimnasio Premium (Gimnasio Premium Elite)
* **Gimnasio (Admin)**: `elite@gym.test` / `admin123`
* **Entrenadores**:
  * `carlos.premium@gym.test` / `admin123`
  * `ana.premium@gym.test` / `admin123`
* **Alumnos (Premium)**:
  * `juan.perez.prem@gym.test` / `user123`
  * `maria.garcia.prem@gym.test` / `user123`

### C. Gimnasio Free Mixto (Gimnasio del Barrio)
* **Gimnasio (Admin)**: `barrio@gym.test` / `admin123`
* **Entrenadores**:
  * `juan.gymfree@gym.test` / `admin123`
* **Alumnos**:
  * `lucas.mix.prem@gym.test` / `user123` (Premium)
  * `pedro.mix.free@gym.test` / `user123` (Free)

### D. Gimnasio Premium Mixto (Gimnasio Fitness Center)
* **Gimnasio (Admin)**: `center@gym.test` / `admin123`
* **Entrenadores**:
  * `andres.trainer@gym.test` / `admin123`
* **Alumnos**:
  * `martin.prem@gym.test` / `user123` (Premium)
  * `carla.free@gym.test` / `user123` (Free)

---

## 👤 2. Perfiles de Personal Trainer (Híbridos - Disponibles simultáneamente)

### A. Personal Trainer Free (Carlos Free)
* **Personal Trainer (Admin/Entrenador)**: `carlos.pt.free@gym.test` / `admin123`
* **Alumnos (Free)**:
  * `juan.alumno.pt@gym.test` / `user123` (Nivel Principiante)
  * `maria.alumna.pt@gym.test` / `user123` (Nivel Intermedio)
  * `luis.alumno.pt@gym.test` / `user123` (Nivel Avanzado)

### B. Personal Trainer Premium (Valeria Premium)
* **Personal Trainer (Admin/Entrenador)**: `valeria.pt.prem@gym.test` / `admin123`
* **Alumnos (Premium)**:
  * `martin.alumno.pt@gym.test` / `user123`
  * `carla.alumna.pt@gym.test` / `user123`
  * `nicolas.alumno.pt@gym.test` / `user123`
