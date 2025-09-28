# Configuración Centralizada de Environments

Este proyecto utiliza una configuración centralizada de environments a través de la librería `gym-library`. Esto permite que tanto `gym-app` como `gym-admin` compartan la misma configuración de Firebase y otros settings de environment.

## Estructura

### Librería (gym-library)
- `src/lib/models/environment.model.ts` - Interfaces TypeScript para la configuración
- `src/lib/environments/environment.ts` - Configuración de desarrollo
- `src/lib/environments/environment.prod.ts` - Configuración de producción

### Aplicaciones
Las aplicaciones importan la configuración desde la librería:

```typescript
import { developmentEnvironment } from 'gym-library';
export const environment = developmentEnvironment;
```

## Cómo actualizar la configuración

1. **Editar la configuración centralizada:**
   - Para desarrollo: `projects/gym-library/src/lib/environments/environment.ts`
   - Para producción: `projects/gym-library/src/lib/environments/environment.prod.ts`

2. **Recompilar la librería:**
   ```bash
   ng build gym-library
   ```

3. **Los cambios se aplicarán automáticamente** a todas las aplicaciones que usen la librería.

## Ventajas

- ✅ **Configuración única:** Un solo lugar para mantener las configuraciones
- ✅ **Consistencia:** Todas las aplicaciones usan exactamente la misma configuración
- ✅ **Mantenimiento simplificado:** Los cambios se propagan automáticamente
- ✅ **Tipo seguro:** TypeScript valida la estructura de la configuración

## Configuración de TypeScript

Para que las aplicaciones puedan importar desde `gym-library`, se ha configurado el `paths` mapping en:

- `projects/gym-app/tsconfig.json`
- `projects/gym-admin/tsconfig.app.json`

```json
{
  "paths": {
    "gym-library": ["../../dist/gym-library"]
  }
}
```

## Importante

Cada vez que se modifique la configuración en la librería, es necesario recompilar la librería con `ng build gym-library` para que los cambios se reflejen en las aplicaciones.