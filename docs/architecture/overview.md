# 🏗️ Arquitectura General - Gym Workspace

> Visión general de la estructura del monorepo y sus componentes

## 📂 Estructura del Proyecto

```
gym-workspace/
├── projects/
│   ├── gym-library/   → Librería compartida
│   ├── gym-admin/     → Panel web administrativo
│   └── gym-app/       → Aplicación móvil
├── docs/              → Documentación centralizada
├── .github/           → CI/CD y configuraciones
├── angular.json       → Configuración del workspace Angular
├── package.json       → Scripts y dependencias raíz
└── tsconfig.json      → Configuración TypeScript base
```

## 🎯 Proyectos del Monorepo

### 📚 gym-library (Librería Compartida)

**Propósito:** Código reutilizable entre gym-admin y gym-app

**Contiene:**
- ✅ Interfaces y tipos TypeScript (`User`, `Routine`, `Exercise`, etc.)
- ✅ Servicios compartidos (Firebase, Auth, Storage)
- ✅ Componentes UI reutilizables
- ✅ Utilidades y helpers
- ✅ Guards y pipes comunes

**NO contiene:**
- ❌ Variables de entorno (se configuran en cada app)
- ❌ Lógica de negocio específica de apps
- ❌ Rutas o páginas completas

**Stack:**
- Angular 20.1.4
- TypeScript 5.8.2
- Formato: ng-packagr

**Ver más:** [gym-library/README.md](../../projects/gym-library/README.md)

---

### 🖥️ gym-admin (Panel Administrativo)

**Propósito:** Interfaz web para administración del gimnasio

**Usuarios:** Administradores y staff del gimnasio

**Características:**
- 👥 Gestión de usuarios (CRUD completo)
- 🏋️ Catálogo de ejercicios
- 📋 Creación y asignación de rutinas
- 👨‍🏫 Gestión de entrenadores
- 📊 Sistema de logs y auditoría
- 🔐 Autenticación con Firebase

**Stack:**
- Angular 20.1.4 (Standalone Components)
- TypeScript 5.8.2
- Firebase (Auth + Firestore)
- Dependencias de gym-library

**Puerto de desarrollo:** http://localhost:4200

**Ver más:** [gym-admin (Arquitectura)](./gym-admin.md)

---

### 📱 gym-app (Aplicación Móvil)

**Propósito:** App para clientes, entrenadores y gimnasios

**Usuarios:** 
- Clientes (entrenar y ver progreso)
- Entrenadores (gestionar clientes y rutinas)
- Gimnasios (dashboard institucional)

**Características:**
- 📋 Dashboard personalizado por rol
- 🏋️ Visualización de rutinas
- 📊 Seguimiento de progreso
- 💬 Chat entre entrenador y cliente (próximamente)
- 🔔 Notificaciones push
- 📸 Compartir en redes sociales

**Stack:**
- Angular 20.0.0
- Ionic 8.x
- Capacitor (Android + iOS)
- TypeScript 5.8.0
- Firebase (Auth + Firestore + Storage)
- Dependencias de gym-library

**Puertos de desarrollo:**
- Web: http://localhost:8100
- Android: `ionic cap run android`

**Ver más:** [gym-app (Arquitectura)](./gym-app.md)

---

## 🔄 Flujo de Datos

```
┌─────────────┐
│  Firebase   │ ← Backend común
└──────┬──────┘
       │
   ┌───┴────────┬──────────┐
   │            │          │
┌──▼───┐   ┌───▼───┐  ┌──▼──────┐
│ Admin│   │  App  │  │ Library │
│      │   │       │  │(shared) │
└──────┘   └───────┘  └─────────┘
```

### Comunicación entre Proyectos

1. **gym-library** exporta servicios y modelos
2. **gym-admin** y **gym-app** importan desde `gym-library`
3. Ambas apps se conectan al mismo Firebase
4. Separación de datos por roles y permisos

## 🛠️ Tecnologías Compartidas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Angular** | 20.x | Framework principal |
| **TypeScript** | 5.8.x | Lenguaje de programación |
| **Firebase Auth** | 10.x | Autenticación |
| **Firestore** | 4.x | Base de datos |
| **Firebase Storage** | 0.x | Almacenamiento |
| **RxJS** | 7.x | Programación reactiva |

## 📦 Gestión de Dependencias

### Instalación

```bash
# Instalar todas las dependencias del monorepo
npm run install:all
```

Este comando ejecuta:
1. `npm install` en la raíz
2. `npm install` en gym-admin
3. `npm install` en gym-app

### Build de la Librería

```bash
# Build único
npm run library:build

# Build con watch (desarrollo)
npm run library:watch
```

**Importante:** La librería debe compilarse antes de usarse en las apps.

## 🚀 Comandos de Desarrollo

### Ejecutar Todo

```bash
# Compilar librería + iniciar ambas apps
npm run dev
```

Esto inicia:
- gym-admin en http://localhost:4200
- gym-app en http://localhost:8100

### Ejecutar Proyectos Individuales

```bash
# Solo gym-admin
npm run gym-admin:serve

# Solo gym-app
npm run gym-app:serve
```

## 🔐 Configuración de Entornos

Cada app tiene sus propias variables de entorno:

```
gym-admin/src/environments/
  ├── environment.development.ts
  └── environment.production.ts

gym-app/src/environments/
  ├── environment.development.ts
  └── environment.production.ts
```

**Nota:** Los archivos de environment NO están en el repositorio por seguridad.

Ver: [Recomendaciones de Seguridad](../security/recommendations.md)

## 🧪 Testing

```bash
# Todos los tests
npm test

# Por proyecto
npm run gym-admin:test
npm run library:test
```

## 📊 Tamaño de Bundle (Aproximado)

| Proyecto | Tamaño Build | Notas |
|----------|--------------|-------|
| gym-admin | ~2.5 MB | Web app optimizada |
| gym-app | ~3.5 MB | Incluye Ionic + Capacitor |
| gym-library | ~500 KB | Solo código compartido |

## 🌐 Despliegue

### gym-admin
- Plataforma: Firebase Hosting / Vercel / Netlify
- Build: `npm run gym-admin:build`
- Output: `projects/gym-admin/dist/`

### gym-app
- Plataforma: Google Play Store / App Store
- Build Web: `npm run gym-app:build`
- Build Android: `npm run gym-app:android`
- Output: `projects/gym-app/www/`

## 🔍 Decisiones de Arquitectura

### ¿Por qué un Monorepo?

✅ Código compartido fácilmente  
✅ Versiones sincronizadas  
✅ CI/CD simplificado  
✅ Refactoring más seguro  
✅ DRY (Don't Repeat Yourself)

### ¿Por qué Standalone Components?

✅ Menos boilerplate  
✅ Mejor tree-shaking  
✅ Bundles más pequeños  
✅ Enfoque moderno de Angular  
✅ Más fácil de testear

### ¿Por qué Firebase?

✅ Backend as a Service  
✅ Real-time updates  
✅ Autenticación lista  
✅ Escalabilidad automática  
✅ Menos mantenimiento

## 📈 Próximos Pasos de Arquitectura

- [ ] Implementar PWA en gym-admin
- [ ] Separar Firebase en dev/staging/prod
- [ ] Añadir cache layer con IndexedDB
- [ ] Implementar lazy loading más agresivo
- [ ] Añadir Service Workers para offline
- [ ] Migrar a SSR/SSG para SEO

---

**Ver también:**
- [Gym Admin - Detalles](./gym-admin.md)
- [Gym App - Detalles](./gym-app.md)
- [Guía de Setup](../getting-started/setup.md)
- [Modelo de Negocio](../business/model.md)
