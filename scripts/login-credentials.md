# Credenciales de prueba (login local)

Generadas con `npm run db:seed`. Requieren **emuladores de Firebase** en marcha.

---

## Contraseñas

| Rol | Contraseña | Apps típicas |
|-----|------------|--------------|
| Admin de gimnasio / PT | `admin123` | `gym-admin` |
| Entrenador | `admin123` | `gym-admin` |
| Super Admin global | `admin123` | `gym-admin` |
| Alumno (entrenado) | `user123` | `gym-app` |

---

## Cómo iniciar sesión

1. `npm run emulator:start` (o `dev:with-emulator`).
2. `npm run db:seed` (si aún no hay datos).
3. Abre la app:
   - **Panel web** → `npm run gym-admin:serve` → login con admin de gimnasio, entrenador o super admin.
   - **App móvil** → `npm run gym-app:serve` → login con email de **alumno** (`user123`).

Usuarios en Auth: [http://localhost:4000](http://localhost:4000) → Authentication.

---

## Referencia rápida

| Quiero probar… | Email | Password |
|----------------|-------|----------|
| Super admin (todos los gimnasios) | `admin@gym.com` | `admin123` |
| Admin gimnasio free | `comunitario@gym.test` | `admin123` |
| Entrenador free | `juan.free@gym.test` | `admin123` |
| Alumno free (app) | `lucas.principiante@gym.test` | `user123` |
| Admin gimnasio premium | `elite@gym.test` | `admin123` |
| Entrenador premium | `carlos.premium@gym.test` | `admin123` |
| Alumno premium (app) | `juan.perez.prem@gym.test` | `user123` |
| PT free | `carlos.pt.free@gym.test` | `admin123` |
| Alumno PT free (app) | `juan.alumno.pt@gym.test` | `user123` |
| PT premium | `valeria.pt.prem@gym.test` | `admin123` |
| Alumno PT premium (app) | `martin.alumno.pt@gym.test` | `user123` |

---

## 1. Gimnasio Free — `gym_free_all_free`

**Admin:** `comunitario@gym.test` · `admin123`

| Entrenador | Email | Password |
|------------|-------|----------|
| Juan Entrenador Free | `juan.free@gym.test` | `admin123` |
| Maria Entrenadora Free | `maria.free@gym.test` | `admin123` |

**Alumnos** (`user123`) — reparto 3 + 3 entre entrenadores:

| Email |
|-------|
| `lucas.principiante@gym.test`, `pedro.intermedio@gym.test`, `tomas.avanzado@gym.test` |
| `sofia.principiante@gym.test`, `clara.intermedio@gym.test`, `mateo.avanzado@gym.test` |

---

## 2. Gimnasio Premium — `gym_premium_all_premium`

**Admin:** `elite@gym.test` · `admin123`

| Entrenador | Email | Password |
|------------|-------|----------|
| Carlos Rodríguez Premium | `carlos.premium@gym.test` | `admin123` |
| Ana Martínez Premium | `ana.premium@gym.test` | `admin123` |
| Roberto Sánchez Premium | `roberto.premium@gym.test` | `admin123` |

**Alumnos** (`user123`) — 5 por entrenador:

| Entrenador | Emails |
|------------|--------|
| Carlos | `juan.perez.prem@gym.test`, `maria.garcia.prem@gym.test`, `luis.fernandez.prem@gym.test`, `elena.lopez.prem@gym.test`, `diego.torres.prem@gym.test` |
| Ana | `sofia.ruiz.prem@gym.test`, `javier.castro.prem@gym.test`, `lucia.morales.prem@gym.test`, `andres.gil.prem@gym.test`, `carmen.ortiz.prem@gym.test` |
| Roberto | `fernando.vega.prem@gym.test`, `isabel.medina.prem@gym.test`, `ricardo.silva.prem@gym.test`, `patricia.ramos.prem@gym.test`, `hugo.navarro.prem@gym.test` |

---

## 3. Personal Trainer Free — `pt_free_all_free`

**Admin / PT:** `carlos.pt.free@gym.test` · `admin123`

**Alumnos** (`user123`):

- `juan.alumno.pt@gym.test`
- `maria.alumna.pt@gym.test`
- `luis.alumno.pt@gym.test`

---

## 4. Personal Trainer Premium — `pt_premium_all_premium`

**Admin / PT:** `valeria.pt.prem@gym.test` · `admin123`

**Alumnos** (`user123`):

- `martin.alumno.pt@gym.test`
- `carla.alumna.pt@gym.test`
- `nicolas.alumno.pt@gym.test`
- `daniela.alumna.pt@gym.test`
- `esteban.alumno.pt@gym.test`
- `florencia.alumna.pt@gym.test`
- `federico.alumno.pt@gym.test`
- `marina.alumna.pt@gym.test`

---

## 5. Super Admin (solo seed completo)

| Email | Password | Notas |
|-------|----------|--------|
| `admin@gym.com` | `admin123` | Creado al final de `npm run db:seed` (no con `--config` aislado) |

---

## Resembrar un solo perfil

```bash
npm run db:seed -- --config=gym-free-all-free
```

Sustituye el alias por el perfil que quieras. Ver opciones en [README.md](./README.md).