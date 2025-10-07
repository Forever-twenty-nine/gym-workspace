# 🚀 Guía de Desarrollo - Gym Workspace

> Comandos, workflow y mejores prácticas para el desarrollo diario

## 📦 Comandos Principales

### Instalación

```bash
# Instalar todas las dependencias del monorepo
npm run install:all

# O manualmente
npm install
cd projects/gym-admin && npm install && cd ../..
cd projects/gym-app && npm install && cd ../..
```

---

## 🏗️ Desarrollo

### Iniciar Todos los Proyectos

```bash
# Compilar librería + iniciar gym-admin + gym-app
npm run dev
```

Esto ejecuta en paralelo:
- ✅ gym-admin en http://localhost:4200
- ✅ gym-app en http://localhost:8100

---

### Proyectos Individuales

#### gym-admin (Panel Web)

```bash
# Desarrollo
npm run gym-admin:serve
# URL: http://localhost:4200

# Build producción
npm run gym-admin:build
# Output: projects/gym-admin/dist/

# Tests
npm run gym-admin:test

# Tests con coverage
npm run gym-admin:test -- --code-coverage
```

#### gym-app (Aplicación Móvil)

```bash
# Desarrollo web
npm run gym-app:serve
# URL: http://localhost:8100

# Build producción
npm run gym-app:build
# Output: projects/gym-app/www/

# Sincronizar con Capacitor
npm run gym-app:sync

# Ejecutar en Android
npm run gym-app:android

# Tests
cd projects/gym-app
npm test
```

#### gym-library (Librería Compartida)

```bash
# Build único
npm run library:build
# Output: dist/gym-library/

# Build con watch (desarrollo)
npm run library:watch

# Tests
npm run library:test
```

---

## 🔄 Workflow de Desarrollo

### 1. Actualizar el Proyecto

```bash
# Obtener últimos cambios
git pull origin master

# Actualizar dependencias si hay cambios en package.json
npm run install:all

# Recompilar librería
npm run library:build
```

### 2. Crear Nueva Feature

```bash
# Crear rama
git checkout -b feature/nombre-descriptivo

# Ejemplo:
git checkout -b feature/add-user-profile
git checkout -b feature/fix-login-bug
```

### 3. Desarrollo Iterativo

```bash
# Iniciar modo desarrollo
npm run dev

# O solo la app en la que trabajas
npm run gym-admin:serve
# o
npm run gym-app:serve
```

### 4. Testing Durante Desarrollo

```bash
# Ejecutar tests en watch mode
npm run gym-admin:test -- --watch

# O tests específicos
npx ng test --include='**/user.service.spec.ts'
```

### 5. Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<tipo>(<scope>): <descripción>

# Tipos comunes
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, sin cambios en código
refactor: refactorización
test: añadir o modificar tests
chore: cambios en build, deps, etc.
```

**Ejemplos:**

```bash
git commit -m "feat(gym-admin): añadir página de gestión de usuarios"
git commit -m "fix(gym-app): corregir error al guardar rutina"
git commit -m "docs: actualizar README con nuevos comandos"
git commit -m "refactor(library): simplificar AuthService"
git commit -m "test(gym-admin): añadir tests para UserComponent"
```

### 6. Push y Pull Request

```bash
# Push a tu rama
git push origin feature/nombre-descriptivo

# Crear Pull Request en GitHub
# 1. Ir a https://github.com/sebasechazu/gym-workspace
# 2. Click en "Compare & pull request"
# 3. Llenar descripción del PR
# 4. Asignar reviewers
# 5. Esperar aprobación
```

---

## 🎨 Generación de Código

### Angular CLI

```bash
# Componente
npx ng generate component nombre-componente

# Servicio
npx ng generate service nombre-servicio

# Guard
npx ng generate guard nombre-guard

# Interface
npx ng generate interface nombre-interface

# Pipe
npx ng generate pipe nombre-pipe
```

### Con proyecto específico

```bash
# En gym-admin
npx ng generate component users --project=gym-admin

# En gym-library
npx ng generate service auth --project=gym-library
```

### Ionic CLI (para gym-app)

```bash
cd projects/gym-app

# Página
ionic generate page nombre-pagina

# Componente
ionic generate component nombre-componente

# Servicio
ionic generate service nombre-servicio
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests del workspace
npm test

# Por proyecto
npm run gym-admin:test
npm run library:test
cd projects/gym-app && npm test

# Con coverage
npm run gym-admin:test -- --code-coverage
```

### Test Individual

```bash
# Ejecutar archivo específico
npx ng test --include='**/nombre.spec.ts'
```

### Watch Mode

```bash
npm run gym-admin:test -- --watch
```

---

## 🐛 Debugging

### VS Code

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug gym-admin",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/projects/gym-admin"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug gym-app",
      "url": "http://localhost:8100",
      "webRoot": "${workspaceFolder}/projects/gym-app"
    }
  ]
}
```

### Chrome DevTools

```bash
# Iniciar con source maps
ng serve --source-map

# O en producción
ng build --source-map
```

---

## 🔍 Linting y Formato

### ESLint

```bash
# Verificar errores
npx ng lint

# Autofix
npx ng lint --fix
```

### Prettier (si está configurado)

```bash
# Formatear todo
npx prettier --write "projects/**/*.{ts,html,css,scss,json}"

# Solo archivos modificados
npx prettier --write $(git diff --name-only --diff-filter=ACMR "*.ts" "*.html" "*.css")
```

---

## 📦 Build y Producción

### Builds de Producción

```bash
# gym-admin
npm run gym-admin:build
# Output: projects/gym-admin/dist/browser/

# gym-app
npm run gym-app:build
# Output: projects/gym-app/www/

# gym-library
npm run library:build
# Output: dist/gym-library/
```

### Analizar Bundle Size

```bash
# gym-admin
npx ng build gym-admin --stats-json
npx webpack-bundle-analyzer projects/gym-admin/dist/stats.json

# gym-app
cd projects/gym-app
npm run build -- --stats-json
npx webpack-bundle-analyzer www/stats.json
```

---

## 🔥 Solución de Problemas Comunes

### Error: Cannot find module 'gym-library'

```bash
# Recompilar la librería
npm run library:build
```

### Puerto en uso

```bash
# Matar proceso en puerto 4200
lsof -ti:4200 | xargs kill -9

# Matar proceso en puerto 8100
lsof -ti:8100 | xargs kill -9

# O usar otro puerto
ng serve --port 4201
ionic serve --port 8101
```

### Node modules corruptos

```bash
# Limpiar todo
rm -rf node_modules package-lock.json
rm -rf projects/gym-admin/node_modules projects/gym-admin/package-lock.json
rm -rf projects/gym-app/node_modules projects/gym-app/package-lock.json

# Reinstalar
npm run install:all
```

### Build falla

```bash
# Limpiar cache de Angular
npx ng cache clean

# Limpiar dist
rm -rf dist/
rm -rf projects/gym-admin/dist/
rm -rf projects/gym-app/www/

# Rebuild
npm run library:build
npm run gym-admin:build
```

---

## 🎯 Mejores Prácticas

### Estructura de Componentes

```typescript
// ✅ CORRECTO: Componente standalone con signals
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  users = signal<User[]>([]);
  userCount = computed(() => this.users().length);
}
```

### Servicios

```typescript
// ✅ CORRECTO: Usar inject() en lugar de constructor
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  
  getUsers() {
    return this.http.get<User[]>('/api/users');
  }
}
```

### Imports

```typescript
// ✅ CORRECTO: Importar desde gym-library
import { User, AuthService } from 'gym-library';

// ❌ INCORRECTO: Paths relativos largos
import { User } from '../../../models/user';
```

---

## 📊 Performance

### Lazy Loading

```typescript
// ✅ Implementar lazy loading en rutas
const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component')
      .then(m => m.UserListComponent)
  }
];
```

### OnPush Change Detection

```typescript
// ✅ SIEMPRE usar OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Optimización de Imágenes

```html
<!-- ✅ Usar NgOptimizedImage -->
<img ngSrc="assets/logo.png" width="200" height="100" priority>
```

---

## 📚 Recursos

- [Angular Style Guide](https://angular.dev/style-guide)
- [Ionic Best Practices](https://ionicframework.com/docs/developing/tips)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [RxJS Guide](https://rxjs.dev/guide/overview)

---

**Ver también:**
- [Setup Inicial](./setup.md)
- [Guía de Estilos](../guides/styles-guide.md)
- [Arquitectura](../architecture/overview.md)

**Última actualización:** Octubre 2025
