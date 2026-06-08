# Datos de prueba (seed)

Rellena el entorno local con usuarios, rutinas y datos de ejemplo.

> Solo para desarrollo con emuladores de Firebase. No usar en producción.

---

## Comandos

| Qué quieres hacer | Comando |
|---|---|
| Cargar todo (recomendado la primera vez) | `npm run db:seed` |
| Cargar un solo gimnasio | `npm run db:seed -- --config=gym-free-all-free` |
| Mismos datos en cada ejecución | `npm run db:seed:deterministic` |

**Perfiles disponibles:** `gym-free-all-free` · `gym-premium-all-premium`

---

## Cómo iniciar sesión

1. Arranca los emuladores: `npm run emulator:start`
2. Carga los datos: `npm run db:seed`
3. Abre la app e iniciá sesión con cualquiera de estos usuarios:

### Gimnasio Free

| Rol | Email | Contraseña |
|---|---|---|
| Admin gimnasio | `comunitario@gym.test` | `admin123` |
| Entrenador | `juan.free@gym.test` | `admin123` |
| Entrenador | `maria.free@gym.test` | `admin123` |
| Alumno | `lucas.principiante@gym.test` | `user123` |
| Alumno | `pedro.intermedio@gym.test` | `user123` |
| Alumno | `tomas.avanzado@gym.test` | `user123` |
| Alumno | `sofia.principiante@gym.test` | `user123` |
| Alumno | `clara.intermedio@gym.test` | `user123` |
| Alumno | `mateo.avanzado@gym.test` | `user123` |

### Gimnasio Premium

| Rol | Email | Contraseña |
|---|---|---|
| Admin gimnasio | `elite@gym.test` | `admin123` |
| Entrenador | `carlos.premium@gym.test` | `admin123` |
| Entrenador | `ana.premium@gym.test` | `admin123` |
| Alumno | `juan.perez.prem@gym.test` | `user123` |
| Alumno | `maria.garcia.prem@gym.test` | `user123` |
| Alumno | `luis.fernandez.prem@gym.test` | `user123` |
| Alumno | `sofia.ruiz.prem@gym.test` | `user123` |
| Alumno | `javier.castro.prem@gym.test` | `user123` |
| Alumno | `lucia.morales.prem@gym.test` | `user123` |

### Super Admin

| Email | Contraseña |
|---|---|
| `admin@gym.com` | `admin123` |

---

## Verificación de modelos

- `npm run seed:typecheck` — verifica que el seed sea compatible con los modelos de `gym-library`.
- `npm run seed:test` — corre los tests de conformance.