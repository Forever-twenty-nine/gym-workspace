# 🏋️ Gym Workspace

> Plataforma integral para gimnasios: conectando entrenados, entrenadores y gimnasios

[![Angular](https://img.shields.io/badge/Angular-21.2-red)](https://angular.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8.8-blue)](https://ionicframework.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange)](https://firebase.google.com/)

## 📱 ¿Qué es Gym Workspace?

Aplicación freemium que revoluciona la gestión de gimnasios mediante:

- 🏃‍♂️ **Para Clientes**: Rutinas personalizadas, seguimiento de progreso, planes especializados
- 👨‍🏫 **Para Entrenadores**: Herramientas pro, gestión de clientes, monetización de rutinas
- 🏢 **Para Gimnasios**: Dashboard centralizado, branding institucional, promoción destacada

## 🚀 Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/sebasechazu/gym-workspace.git
cd gym-workspace

# Instalar dependencias
npm run install:all

# Iniciar desarrollo
npm run dev
```

**✨ Listo!** Abre:
- 🖥️ **gym-admin**: http://localhost:4200
- 📱 **gym-app**: http://localhost:8100

## 📚 Documentación

> Toda la documentación está en `/docs` ([índice](./docs/README.md)). Para las IAs: [`AGENTS.md`](./AGENTS.md).

### 🏗️ Arquitectura
- **[🖥️ Gym Admin](./docs/architecture/gym-admin.md)** - Panel administrativo
- **[📱 Gym App](./docs/architecture/gym-app.md)** - Aplicación móvil
- **[📦 Gym Library](./docs/architecture/gym-library.md)** - Librería compartida

### ✨ Funcionalidades
- **[🏃 Entrenados](./docs/features/features-traines.md)**
- **[👨‍🏫 Entrenadores](./docs/features/features-trainers.md)**
- **[🏢 Gimnasios](./docs/features/features-gyms.md)**

## 🛠️ Comandos Principales

```bash
# Desarrollo
npm run dev                    # Iniciar todo (admin + app)
npm run dev:with-emulator      # Iniciar todo + emuladores de Firebase
npm run gym-app:with-emulator  # Iniciar solo la App + emuladores
npm run gym-admin:serve        # Solo panel admin
npm run gym-app:serve          # Solo app móvil

# Datos y Utilidades
npm run db:seed                # Cargar datos de prueba en el emulador
npm run kill-emulators         # Liberar puertos de Firebase bloqueados

# Build
npm run library:build          # Compilar librería base
npm run gym-admin:build        # Build admin
npm run gym-app:build          # Build app
```

## 📦 Estructura del Proyecto

```
gym-workspace/
├── projects/
│   ├── gym-library/   → Código compartido
│   ├── gym-admin/     → Panel web (Angular)
│   └── gym-app/       → App móvil (Ionic)
├── docs/              → 📚 Documentación centralizada
└── .github/           → CI/CD y configuraciones
```

## 🤝 Contribuir

1. Instalá todo con `npm run install:all` (ver [Inicio Rápido](#-inicio-rápido))
2. Crea una rama: `git checkout -b feature/nombre`
3. Haz commits con [Conventional Commits](https://www.conventionalcommits.org/)
4. Push: `git push origin feature/nombre`
5. Crea un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Mantenido con ❤️ por [@sebasechazu](https://github.com/sebasechazu)**
