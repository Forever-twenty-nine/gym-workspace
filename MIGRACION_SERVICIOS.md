# 🔄 Guía de Migración: Servicios Centralizados

## ✅ **¿Qué se eliminó?**

### **gym-admin**
- ❌ `src/app/services/` (carpeta completa eliminada)
  - `cliente.service.ts`
  - `user.service.ts`
  - `rutina.service.ts`
  - `ejercicio.service.ts`

### **gym-app**
- ❌ `src/app/core/services/` (servicios obsoletos eliminados)
  - `auth.service.ts`
  - `cliente.service.ts`
  - `ejercicio.service.ts`
  - `rutina.service.ts`
  - `storage.service.ts`
  - `user.service.ts`
- ✅ `app-configuration.service.ts` (conservado)

## 🔧 **Cambios en Imports**

### **Antes:**
```typescript
import { ClienteService } from './services/cliente.service';
import { UserService } from '../core/services/user.service';
```

### **Ahora:**
```typescript
import { ClienteService, UserService, RutinaService, EjercicioService } from 'gym-library';
```

## 📋 **Cambios en API de Métodos**

### **ClienteService**
| Antes | Ahora |
|-------|-------|
| `obtenerClientes()` | `clientes` (signal) |
| `obtenerClientePorId(id)` | `getCliente(id)` |
| `guardarCliente(cliente)` | `save(cliente)` |
| `eliminarCliente(id)` | `delete(id)` |

### **RutinaService**
| Antes | Ahora |
|-------|-------|
| `obtenerRutinas()` | `rutinas` (signal) |
| `guardarRutina(rutina)` | `save(rutina)` |
| `eliminarRutina(id)` | `delete(id)` |

### **EjercicioService**
| Antes | Ahora |
|-------|-------|
| `obtenerEjercicios()` | `ejercicios` (signal) |
| `guardarEjercicio(ejercicio)` | `save(ejercicio)` |
| `eliminarEjercicio(id)` | `delete(id)` |

### **UserService**
| Antes | Ahora |
|-------|-------|
| `removeUser(id)` | `deleteUser(id)` |
| `getCurrentUser()` | `user` (signal) |
| `getUserId()` | `user().uid` |

### **AuthService**
| Antes | Ahora |
|-------|-------|
| `login(email, password)` | `loginWithEmail(email, password)` |
| - | `loginWithGoogle()` |
| - | `logout()` |

## 🚀 **Ejemplo de Migración**

### **Antes:**
```typescript
export class DashboardPage {
  private clienteService = inject(ClienteService);
  
  ngOnInit() {
    this.clientes = this.clienteService.obtenerClientes();
  }
  
  async eliminar(id: string) {
    await this.clienteService.eliminarCliente(id);
  }
}
```

### **Después:**
```typescript
export class DashboardPage {
  private clienteService = inject(ClienteService);
  
  // Los signals se acceden directamente
  clientes = this.clienteService.clientes;
  
  async eliminar(id: string) {
    await this.clienteService.delete(id);
  }
}
```

## ⚡ **Beneficios Obtenidos**

- ✅ **API unificada** entre gym-admin y gym-app
- ✅ **Signals reactivos** por defecto
- ✅ **Menos duplicación** de código
- ✅ **Mantenimiento centralizado**
- ✅ **Adaptadores flexibles** para diferentes backends

## 🔧 **Configuración Automática**

Los servicios se configuran automáticamente mediante adaptadores:

- **gym-admin**: `app.config.ts` configura los adaptadores de Firestore
- **gym-app**: `AppConfigurationService` configura adaptadores de Firebase/Ionic

## 📝 **Próximos Pasos**

1. Actualizar componentes para usar la nueva API
2. Reemplazar métodos obsoletos con signals
3. Probar la funcionalidad en ambos proyectos
4. Eliminar imports no utilizados

---
**Estado**: ✅ Servicios centralizados implementados y servicios obsoletos eliminados