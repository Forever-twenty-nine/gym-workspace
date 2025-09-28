# GymWorkspace

Este repositorio contiene un monorepo de Angular que incluye múltiples aplicaciones y librerías para la gestión de gimnasios. El proyecto fue generado usando [Angular CLI](https://github.com/angular/angular-cli) versión 20.1.4.

## 📋 Contenido del Repositorio

### 🏢 **gym-admin** - Panel de Administración Web
Aplicación web para administradores de gimnasios construida con Angular 20 y Firebase. Incluye:
- **Tecnologías**: Angular 20, Firebase/Firestore, TailwindCSS
- **Características**: Gestión de clientes, rutinas, ejercicios y entrenadores
- **Servicios**: ClienteService, EjercicioService, RutinaService, UserService
- **Ubicación**: `projects/gym-admin/`

### 📱 **gym-app** - Aplicación Móvil Híbrida
Aplicación móvil multiplataforma desarrollada con Ionic y Capacitor para clientes y entrenadores:
- **Tecnologías**: Ionic 8, Angular 20, Capacitor 7, Firebase
- **Plataformas**: Android (incluye configuración nativa)
- **Módulos**: Auth, Cliente, Entrenador, Gimnasio
- **Características**: Autenticación, gestión de rutinas, seguimiento de progreso
- **Ubicación**: `projects/gym-app/`

### 📚 **gym-library** - Librería Compartida
Librería Angular que contiene modelos, enums y utilidades compartidas entre las aplicaciones:
- **Modelos**: Cliente, Ejercicio, Entrenador, Gimnasio, Invitación, Rutina, User
- **Enums**: ClienteTabs, GimnasioTabs, Objetivo, Permiso, Rol
- **Propósito**: Mantener consistencia de tipos y estructuras de datos
- **Ubicación**: `projects/gym-library/`

## 🚀 Desarrollo

Este es un **multi-repositorio** que contiene tres proyectos independientes. Cada proyecto tiene sus propias dependencias y configuraciones.

### 📦 Instalación de Dependencias

Para instalar todas las dependencias de todos los proyectos:

```bash
npm run install:all
```

O instalar individualmente:
```bash
# Workspace principal (solo para la librería)
npm install

# Proyecto gym-admin
cd projects/gym-admin && npm install

# Proyecto gym-app  
cd projects/gym-app && npm install
```

### 🛠️ Desarrollo por Aplicación

#### 🏢 Gym Admin (Aplicación Web)
```bash
# Opción 1: Usando script del workspace
npm run gym-admin:serve

# Opción 2: Desde el directorio del proyecto
cd projects/gym-admin
npm run start
```

#### 📱 Gym App (Aplicación Móvil)
```bash
# Opción 1: Usando script del workspace
npm run gym-app:serve

# Opción 2: Desde el directorio del proyecto
cd projects/gym-app
ionic serve
```

#### 📚 Gym Library (Librería Compartida)
```bash
# Opción 1: Usando script del workspace
npm run library:build

# Opción 2: Desde la raíz del workspace
ng build gym-library
```

### 🔨 Construcción de Proyectos

```bash
# Gym Admin
npm run gym-admin:build

# Gym App
npm run gym-app:build

# Gym Library
npm run library:build
```

## 🧪 Pruebas

Para ejecutar pruebas unitarias con el test runner [Karma](https://karma-runner.github.io):

```bash
ng test
```

Para pruebas end-to-end (e2e):

```bash
ng e2e
```

Angular CLI no incluye un framework de testing e2e por defecto. Puedes elegir uno que se adapte a tus necesidades.

## 📱 Desarrollo Móvil (Gym App)

### Prerrequisitos
- Node.js y npm
- Ionic CLI: `npm install -g @ionic/cli`
- Capacitor CLI: `npm install -g @capacitor/cli`
- Android Studio (para desarrollo Android)

### Comandos Específicos para Móvil
```bash
# Servir en modo desarrollo (desde workspace)
npm run gym-app:serve

# Sincronizar con plataformas nativas
npm run gym-app:sync

# Ejecutar en Android
npm run gym-app:android

# O desde el directorio del proyecto:
cd projects/gym-app
ionic serve
ionic cap sync
ionic cap run android
```

## 🏗️ Arquitectura del Proyecto

```
gym-workspace/
├── projects/
│   ├── gym-admin/          # 🏢 Aplicación web de administración
│   ├── gym-app/            # 📱 Aplicación móvil híbrida
│   └── gym-library/        # 📚 Librería compartida
├── package.json            # Dependencias del workspace
└── angular.json           # Configuración de Angular CLI
```

## 🔧 Tecnologías Utilizadas

- **Frontend**: Angular 20, Ionic 8
- **Backend**: Firebase/Firestore
- **Móvil**: Capacitor 7
- **Estilos**: TailwindCSS, Ionic Components
- **Lenguaje**: TypeScript
- **Herramientas**: Angular CLI, Ionic CLI

## 📚 Recursos Adicionales

Para más información sobre el uso de Angular CLI, incluyendo referencias detalladas de comandos, visita la página [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
