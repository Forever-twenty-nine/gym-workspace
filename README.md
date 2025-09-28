# GymWorkspace

Este repositorio contiene un monorepo de Angular que incluye múltiples aplicaciones y librerías para la gestión de gimnasios. El proyecto fue generado usando [Angular CLI](https://github.com/angular/angular-cli) versión 20.1.4.

## 📋 Contenido del Repositorio

### 🏢 **admin-gym** - Panel de Administración Web
Aplicación web para administradores de gimnasios construida con Angular 20 y Firebase. Incluye:
- **Tecnologías**: Angular 20, Firebase/Firestore, TailwindCSS
- **Características**: Gestión de clientes, rutinas, ejercicios y entrenadores
- **Servicios**: ClienteService, EjercicioService, RutinaService, UserService
- **Ubicación**: `projects/admin-gym/`

### 📱 **tabs-app** - Aplicación Móvil Híbrida
Aplicación móvil multiplataforma desarrollada con Ionic y Capacitor para clientes y entrenadores:
- **Tecnologías**: Ionic 8, Angular 20, Capacitor 7, Firebase
- **Plataformas**: Android (incluye configuración nativa)
- **Módulos**: Auth, Cliente, Entrenador, Gimnasio
- **Características**: Autenticación, gestión de rutinas, seguimiento de progreso
- **Ubicación**: `projects/tabs-app/`

### 📚 **gym-library** - Librería Compartida
Librería Angular que contiene modelos, enums y utilidades compartidas entre las aplicaciones:
- **Modelos**: Cliente, Ejercicio, Entrenador, Gimnasio, Invitación, Rutina, User
- **Enums**: ClienteTabs, GimnasioTabs, Objetivo, Permiso, Rol
- **Propósito**: Mantener consistencia de tipos y estructuras de datos
- **Ubicación**: `projects/gym-library/`


### Construcción del Proyecto
Para construir el proyecto ejecuta:






Esto compilará tu proyecto y almacenará los artefactos de construcción en el directorio `dist/`. Por defecto, la construcción de producción optimiza tu aplicación para rendimiento y velocidad.

### Desarrollo por Aplicación

#### Admin Gym (Web)
```bash
ng serve admin-gym
```

#### Tabs App (Móvil)
```bash
ng serve tabs-app
```

#### Construcción de la Librería
```bash
ng build gym-library
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

## 📱 Desarrollo Móvil (Tabs App)

### Prerrequisitos
- Node.js y npm
- Ionic CLI: `npm install -g @ionic/cli`
- Capacitor CLI: `npm install -g @capacitor/cli`
- Android Studio (para desarrollo Android)

### Comandos Específicos para Móvil
```bash
# Servir en modo desarrollo
ionic serve

# Sincronizar con plataformas nativas
npx cap sync

# Abrir en Android Studio
npx cap open android
```

## 🏗️ Arquitectura del Proyecto

```
gym-workspace/
├── projects/
│   ├── admin-gym/          # 🏢 Aplicación web de administración
│   ├── tabs-app/           # 📱 Aplicación móvil híbrida
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
