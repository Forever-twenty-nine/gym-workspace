# Datos de prueba (seed)

Rellena el entorno local con usuarios, rutinas y datos de ejemplo para probar sin cargar todo a mano.

> Solo para desarrollo con emuladores de Firebase. No usar en producción.

---

## Antes de empezar

1. Arranca los emuladores (`npm run emulator:start` o `npm run dev:with-emulator`).
2. Desde la **raíz del proyecto**, ejecuta el seed.

---

## Comandos

| Qué quieres hacer | Comando |
|-------------------|---------|
| Cargar **todo** (recomendado la primera vez) | `npm run db:seed` |
| Ver ayuda y opciones | `npm run db:seed -- --help` |
| Cargar **un solo gimnasio/PT** | `npm run db:seed -- --config=gym-free-all-free` |
| Mismos datos en cada ejecución | `npm run db:seed:deterministic` |
| Cerrar procesos que bloquean los puertos | `npm run kill-emulators` |

**Perfiles para `--config`:**

- `gym-free-all-free` — gimnasio plan free  
- `gym-premium-all-premium` — gimnasio plan premium  
- `pt-free-all-free` — personal trainer free  
- `pt-premium-all-premium` — personal trainer premium  

---

## Después del seed

- Revisa usuarios y datos: [http://localhost:4000](http://localhost:4000)  
- **Emails y contraseñas para iniciar sesión:** [login-credentials.md](./login-credentials.md)

---

## Flujo habitual

```text
1. npm run emulator:start
2. npm run db:seed
3. Abrir gym-admin o gym-app e iniciar sesión (ver login-credentials.md)
```