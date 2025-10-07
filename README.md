# 🏋️ Gym Workspace

> Plataforma integral para gimnasios: conectando entrenados, entrenadores y gimnasios

[![Angular](https://img.shields.io/badge/Angular-20.1.4-red)](https://angular.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8.x-blue)](https://ionicframework.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)](https://firebase.google.com/)

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

## 📚 Documentación Completa

> Toda la documentación está organizada en `/docs`

### 🎯 Para Empezar
- **[📖 Guía de Setup](./docs/getting-started/setup.md)** - Instalación paso a paso
- **[📋 Prerrequisitos](./docs/getting-started/prerequisites.md)** - Herramientas necesarias

### 🏗️ Arquitectura
- **[🔍 Visión General](./docs/architecture/overview.md)** - Estructura del monorepo
- **[🖥️ Gym Admin](./docs/architecture/gym-admin.md)** - Panel administrativo
- **[📱 Gym App](./docs/architecture/gym-app.md)** - Aplicación móvil (próximamente)

### 💼 Business
- **[💰 Modelo de Negocio](./docs/business/model.md)** - Estrategia freemium y monetización

### �� Guías
- **[🚀 Desarrollo](./docs/guides/development.md)** - Comandos y workflow
- **[🎨 Estilos](./docs/guides/styles-guide.md)** - Convenciones CSS

### 🔒 Seguridad
- **[🛡️ Recomendaciones](./docs/security/recommendations.md)** - Mejores prácticas

📖 **[Ver índice completo de documentación →](./docs/README.md)**

## 🛠️ Comandos Principales

```bash
# Desarrollo
npm run dev              # Iniciar todo (admin + app)
npm run gym-admin:serve  # Solo panel admin
npm run gym-app:serve    # Solo app móvil

# Build
npm run library:build    # Compilar librería
npm run gym-admin:build  # Build admin
npm run gym-app:build    # Build app

# Testing
npm test                 # Todos los tests
npm run gym-admin:test   # Tests admin
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

1. Lee la [Guía de Setup](./docs/getting-started/setup.md)
2. Crea una rama: `git checkout -b feature/nombre`
3. Haz commits con [Conventional Commits](https://www.conventionalcommits.org/)
4. Push: `git push origin feature/nombre`
5. Crea un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

---

**Mantenido con ❤️ por [@sebasechazu](https://github.com/sebasechazu)**
