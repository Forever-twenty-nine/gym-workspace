# 📱 Gym App - Aplicación Móvil

> Aplicación móvil Ionic para clientes, entrenadores y gimnasios

## 🎯 Propósito

**gym-app** es la aplicación móvil multiplataforma (Android/iOS) que permite a los usuarios finales interactuar con el ecosistema del gimnasio.

## 👥 Tipos de Usuarios

### 🏃‍♂️ Clientes (Entrenados)
- Ver rutinas asignadas
- Registrar progreso
- Ver estadísticas personales
- Compartir logros en redes sociales
- Chat con su entrenador

### 👨‍🏫 Entrenadores
- Dashboard de clientes
- Gestión de rutinas
- Seguimiento de progreso de clientes
- Chat con clientes
- Venta de rutinas premium

### 🏢 Gimnasios
- Dashboard institucional
- Gestión de equipo de entrenadores
- Estadísticas generales
- Branding personalizado

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | 20.0.0 | Framework UI |
| **Ionic** | 8.x | Componentes móviles |
| **Capacitor** | 6.x | Bridge nativo |
| **TypeScript** | 5.8.0 | Lenguaje |
| **Firebase** | 10.x | Backend |
| **RxJS** | 7.x | Programación reactiva |

## 📂 Estructura del Proyecto

```
gym-app/
├── src/
│   ├── app/
│   │   ├── auth/              → Módulo de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── onboarding/
│   │   │   └── welcome/
│   │   ├── cliente/           → Páginas para clientes
│   │   │   ├── dashboard/
│   │   │   ├── entrenamientos/
│   │   │   └── cliente-tabs/
│   │   ├── entrenador/        → Páginas para entrenadores
│   │   │   ├── dashboard/
│   │   │   ├── clientes/
│   │   │   └── entrenador-tabs/
│   │   ├── gimnasio/          → Páginas para gimnasios
│   │   │   ├── gimnasio-dashboard/
│   │   │   ├── gimnasio-users/
│   │   │   └── gimnasio-tabs/
│   │   └── components/        → Componentes compartidos
│   ├── assets/                → Imágenes, iconos
│   ├── environments/          → Configuración de entornos
│   ├── theme/                 → Tema de Ionic customizado
│   └── global.css             → Estilos globales
├── android/                   → Proyecto Android nativo
└── capacitor.config.ts        → Configuración de Capacitor
```

## 🎨 Sistema de Tabs por Rol

### Cliente Tabs
```typescript
- Dashboard (Home)
- Entrenamientos
- Progreso
- Nutrición (próximamente)
- Comunidad (próximamente)
- Perfil
```

### Entrenador Tabs
```typescript
- Dashboard (Home)
- Clientes
- Entrenamientos (rutinas disponibles)
- Perfil
```

### Gimnasio Tabs
```typescript
- Dashboard (Home)
- Usuarios (gestión)
- Entrenadores
- Perfil
```

## 🎨 Estilos Centralizados

Los estilos están organizados en `src/global.css`:

- Variables CSS globales
- Estilos de componentes Ionic
- Clases utilitarias
- Estilos de autenticación
- Estilos de dashboard
- Animaciones

**Ver:** [Guía de Estilos](../guides/styles-guide.md)

## 🔥 Firebase Integration

### Servicios Utilizados

| Servicio | Uso |
|----------|-----|
| **Authentication** | Login con email/password, Google, etc. |
| **Firestore** | Base de datos de usuarios, rutinas, ejercicios |
| **Storage** | Imágenes de perfil, fotos de progreso |
| **Cloud Functions** | Lógica de backend (próximamente) |

### Colecciones Firestore

```
/users/{userId}
/routines/{routineId}
/exercises/{exerciseId}
/workouts/{workoutId}
/progress/{progressId}
/gyms/{gymId}
```

## 📱 Capacitor Plugins

```json
{
  "@capacitor/camera": "Captura de fotos de progreso",
  "@capacitor/filesystem": "Almacenamiento local",
  "@capacitor/network": "Estado de conectividad",
  "@capacitor/push-notifications": "Notificaciones push",
  "@capacitor/share": "Compartir en redes sociales",
  "@capacitor/splash-screen": "Splash screen nativa"
}
```

## 🚀 Desarrollo

### Iniciar en Navegador

```bash
npm run gym-app:serve
# o
cd projects/gym-app
ionic serve
```

**URL:** http://localhost:8100

### Ejecutar en Android

```bash
# Sincronizar cambios
npm run gym-app:sync

# Abrir en Android Studio
npm run gym-app:android

# O directamente en dispositivo/emulador
cd projects/gym-app
ionic cap run android
```

### Live Reload en Dispositivo

```bash
cd projects/gym-app
ionic cap run android --livereload --external
```

## 🧪 Testing

```bash
cd projects/gym-app
npm test

# Con coverage
npm test -- --code-coverage
```

## 📦 Build

### Web

```bash
npm run gym-app:build
# Output: projects/gym-app/www/
```

### Android

```bash
cd projects/gym-app
ionic build --prod
ionic cap sync android
cd android
./gradlew assembleRelease
```

**APK generado:** `android/app/build/outputs/apk/release/`

### iOS (requiere macOS)

```bash
cd projects/gym-app
ionic build --prod
ionic cap sync ios
ionic cap open ios
# Build desde Xcode
```

## 🎯 Características Clave

### ✅ Implementadas

- 🔐 Sistema de autenticación completo
- 👤 Onboarding para nuevos usuarios
- 📊 Dashboard por rol (cliente/entrenador/gimnasio)
- 🏋️ Visualización de rutinas
- 📱 Navegación con tabs
- 🎨 Tema personalizado de Ionic

### 🚧 En Desarrollo

- 💬 Chat en tiempo real
- 📈 Gráficas de progreso avanzadas
- 🔔 Notificaciones push
- 📸 Galería de fotos de progreso
- 🌐 Compartir en redes sociales
- 💰 Sistema de pagos in-app

### 📋 Roadmap

- [ ] PWA (Progressive Web App)
- [ ] Modo offline con sincronización
- [ ] Soporte para iOS
- [ ] Widget de Android
- [ ] Integración con wearables
- [ ] Planes de nutrición
- [ ] Comunidad y foro

## 📊 Performance

### Métricas

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| **First Load** | < 3s | ~2.5s |
| **Bundle Size** | < 5 MB | ~3.5 MB |
| **Runtime Performance** | > 60 FPS | 60 FPS |

### Optimizaciones

- ✅ Lazy loading de rutas
- ✅ OnPush change detection
- ✅ Imágenes optimizadas
- ✅ Tree-shaking habilitado
- ✅ Minificación en producción

## 🐛 Debugging

### Chrome DevTools

```bash
ionic serve
# Abrir Chrome DevTools (F12)
```

### Android Studio Logcat

```bash
# Ver logs en tiempo real
adb logcat | grep Chromium
```

### Safari Web Inspector (iOS)

1. Habilitar "Web Inspector" en iOS
2. Conectar dispositivo
3. Safari → Develop → [Dispositivo]

## 🔧 Configuración

### Capacitor

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.gymapp.app',
  appName: 'Gym App',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};
```

### Ionic

```json
// ionic.config.json
{
  "name": "gym-app",
  "integrations": {
    "capacitor": {}
  },
  "type": "angular"
}
```

## 🔗 Recursos

### Documentación Oficial
- [Ionic Framework](https://ionicframework.com/docs)
- [Capacitor](https://capacitorjs.com/docs)
- [Angular](https://angular.dev/)

### Herramientas
- [Ionic Native](https://ionicframework.com/docs/native)
- [Ionic CLI](https://ionicframework.com/docs/cli)

---

**Ver también:**
- [Arquitectura General](./overview.md)
- [Gym Admin](./gym-admin.md)
- [Guía de Estilos](../guides/styles-guide.md)
- [Guía de Setup](../getting-started/setup.md)
