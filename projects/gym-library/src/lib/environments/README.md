# Environments

Esta carpeta contiene las configuraciones de entorno para la librería.

## Archivos

### `environment.ts`
Archivo principal que exporta todas las configuraciones de entorno:

- **`developmentEnvironment`**: Configuración para desarrollo local con Firebase Emulator Suite
- **`firebaseEnvironment`**: Configuración para desarrollo con Firebase real en la nube
- **`productionEnvironment`**: Configuración para producción

### `environment.secrets.ts`
Archivo que contiene las claves de Firebase. Este archivo:
- Está en `.gitignore` y **no se sube al repositorio**
- Se genera automáticamente con valores demo
- Debe ser reemplazado con tus claves reales para usar Firebase

### `environment.secrets.example.ts`
Archivo de ejemplo que sirve como plantilla para `environment.secrets.ts`.

## Uso

### Configuración inicial

1. Las configuraciones se importan automáticamente desde `gym-library`:

```typescript
import { developmentEnvironment, productionEnvironment, firebaseEnvironment } from 'gym-library';
```

2. Para usar Firebase con claves reales:
   - Copia `environment.secrets.example.ts` como `environment.secrets.ts`
   - Reemplaza los valores de ejemplo con tus claves de Firebase Console
   - El archivo se ignorará automáticamente por git

### Entornos disponibles

#### Development (Emulators)
```typescript
import { developmentEnvironment } from 'gym-library';

// Usa Firebase Emulator Suite
// production: false
// useEmulator: true
```

#### Development (Firebase Cloud)
```typescript
import { firebaseEnvironment } from 'gym-library';

// Usa Firebase real en la nube
// production: false
// useEmulator: false
```

#### Production
```typescript
import { productionEnvironment } from 'gym-library';

// Usa Firebase en producción
// production: true
// useEmulator: false
```

## Seguridad

⚠️ **IMPORTANTE**: Nunca subas `environment.secrets.ts` al repositorio. Este archivo contiene claves sensibles y debe mantenerse privado.

El archivo está protegido por `.gitignore` con la regla: `**/environment.secrets.ts`
