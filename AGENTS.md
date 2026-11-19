# AGENTS.md — Gym Workspace

Contexto para las IAs que trabajen en este repo (Claude, Mavis/MiniMax, Copilot). Corto a propósito: el detalle va en `docs/`.

## Cómo se trabaja

Mismo flujo que en todos los repos del dueño (`~/.claude/CLAUDE.md` y `~/.minimax/AGENTS.md`): **Claude planifica, decide con Sebastián y revisa; Mavis ejecuta.** Claude le delega cada tarea con `powershell -File $HOME\bin\mcode-tarea.ps1 -PromptFile <archivo.md>` desde la raíz del repo, un ítem por vez, y revisa el resultado y `git status` antes de cerrarlo. Mavis no commitea ni pushea. Las decisiones de producto las toma Sebastián: se le preguntan, no se asumen.

Responder siempre en español (es-AR).

## Qué es

Plataforma para gimnasios (entrenados, entrenadores y gimnasios). Monorepo Angular con Firebase:

| Proyecto | Qué es | Local |
| --- | --- | --- |
| `projects/gym-admin` | Panel administrativo (Angular) | http://localhost:4200 |
| `projects/gym-app` | App móvil (Ionic + Capacitor, con Storybook) | http://localhost:8100 |
| `projects/gym-library` | Librería compartida (se buildea antes de las apps) | — |

Arquitectura de cada uno en `docs/architecture/`. Cada proyecto tiene su propio `package.json` (`npm run install:all` instala todo).

## Comandos

Todos desde la raíz (`package.json`):

- Desarrollo: `npm run dev` (buildea la librería y levanta las dos apps); con emulador: `npm run dev:with-emulator`.
- Emulador: `npm run emulator:start` (proyecto `demo-gym`, datos en `emulator-data/`); `npm run kill-emulators` si queda colgado.
- Seeds: `npm run db:seed` (`:deterministic` para datos fijos).
- Build y tests: `npm run library:build`, `npm run gym-admin:build`, `npm run gym-app:build`, `npm run gym-admin:test`, `npm run gym-app:test`, `npm run seed:test`.
- Deploy: `npm run deploy` (buildea todo y hace `firebase deploy`). **Solo con confirmación de Sebastián.**

Si se toca `gym-library`, rebuildearla antes de probar las apps.

## Convenciones

Las reglas de Angular y TypeScript están en `.github/instructions/angular admin.instructions.md` y valen para todo el repo: standalone, signals, `input()`/`output()`, `inject()`, `OnPush`, control flow nativo (`@if`/`@for`), sin `any`, sin `ngClass`/`ngStyle`.
