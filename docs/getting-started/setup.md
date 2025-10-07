# 🚀 Setup para Desarrolladores - Gym Workspace

> Guía completa para configurar el proyecto en tu máquina local

## 📋 Prerrequisitos

> 💡 **Ver guía completa:** [Prerrequisitos detallados](./prerequisites.md)

Antes de comenzar, asegúrate de tener instalado:

### Requerimientos Obligatorios

| Herramienta | Versión Mínima | Verificar instalación | Instalación |
|-------------|----------------|----------------------|-------------|
| **Node.js** | v18.x o superior | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.x o superior | `npm --version` | (incluido con Node.js) |
| **Git** | v2.x o superior | `git --version` | [git-scm.com](https://git-scm.com/) |

### Requerimientos Opcionales (para gym-app móvil)

| Herramienta | Para | Instalación |
|-------------|------|-------------|
| **Ionic CLI** | Desarrollo de gym-app | `npm install -g @ionic/cli` |
| **Android Studio** | Build Android | [developer.android.com](https://developer.android.com/studio) |
| **Java JDK** | v17 (para Android) | [oracle.com/java](https://www.oracle.com/java/technologies/downloads/) |

---

## 🔧 Instalación Inicial

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/sebasechazu/gym-workspace.git
cd gym-workspace
```

### Paso 2: Instalar Dependencias

Este proyecto es un **monorepo** con múltiples aplicaciones. Necesitas instalar dependencias en cada una:

#### Opción A: Comando automático (Recomendado) ✨

```bash
npm run install:all
```

Este comando instala dependencias en:
- Raíz del workspace
- `projects/gym-admin`
- `projects/gym-app`
- `projects/gym-library`

#### Opción B: Manual (si el comando automático falla)

```bash
# Dependencias del workspace raíz
npm install

# Dependencias de gym-admin
cd projects/gym-admin
npm install
cd ../..

# Dependencias de gym-app
cd projects/gym-app
npm install
cd ../..

# Dependencias de gym-library (si las tiene)
cd projects/gym-library
npm install
cd ../..
```

### Paso 3: Configurar Variables de Entorno

⚠️ **IMPORTANTE**: Solicita las credenciales de Firebase al líder del proyecto.

#### gym-admin

```bash
# Navegar a la carpeta de gym-admin
cd projects/gym-admin/src/environments

# Copiar el archivo de plantilla
cp environment.template.ts environment.ts

# Editar con tus credenciales
nano environment.ts  # o usa tu editor favorito
```

#### gym-app

```bash
# Navegar a la carpeta de gym-app
cd projects/gym-app/src/environments

# Copiar el archivo de plantilla
cp environment.template.ts environment.ts

# Editar con tus credenciales
nano environment.ts  # o usa tu editor favorito
```

> 💡 **Nota**: Los archivos `environment.ts` están en `.gitignore` y NO deben hacer commit.

---

## ▶️ Ejecutar el Proyecto

### Estructura del Proyecto

Este workspace contiene 3 proyectos:

```
gym-workspace/
├── projects/
│   ├── gym-library/   → Librería compartida (componentes, servicios, modelos)
│   ├── gym-admin/     → Panel administrativo (Angular standalone)
│   └── gym-app/       → App móvil (Ionic + Angular)
```

### Comandos de Desarrollo

#### 🎯 Opción 1: Ejecutar TODO (Recomendado para desarrollo completo)

```bash
# Compila la librería + inicia gym-admin + gym-app
npm run dev
```

Este comando ejecuta en paralelo:
- ✅ `gym-admin` en http://localhost:4200
- ✅ `gym-app` en http://localhost:8100

#### 📚 Opción 2: Ejecutar TODO incluyendo watch de la librería

```bash
# Compila la librería en modo watch + inicia ambas apps
npm run dev:all
```

Útil cuando estás haciendo cambios en `gym-library` y quieres ver los cambios reflejados automáticamente.

#### 🔧 Opción 3: Ejecutar Proyectos Individuales

**Solo gym-admin:**
```bash
npm run gym-admin:serve
# Abre en: http://localhost:4200
```

**Solo gym-app:**
```bash
npm run gym-app:serve
# Abre en: http://localhost:8100
```

**Solo gym-library (build):**
```bash
npm run library:build
```

**Solo gym-library (watch mode):**
```bash
npm run library:watch
```

---

## 📱 Desarrollo Móvil (gym-app)

### Ejecutar en Navegador

```bash
npm run gym-app:serve
```

### Ejecutar en Android

#### Prerequisitos para Android:

1. **Android Studio** instalado
2. **Android SDK** configurado
3. **Variables de entorno** configuradas:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   ```

#### Comandos:

```bash
# Sincronizar cambios con Capacitor
npm run gym-app:sync

# Ejecutar en dispositivo/emulador Android
npm run gym-app:android
```

---

## 🧪 Testing

### Ejecutar Tests

**Todos los tests:**
```bash
npm test
```

**gym-admin:**
```bash
npm run gym-admin:test
```

**gym-library:**
```bash
npm run library:test
```

**gym-app:**
```bash
cd projects/gym-app
npm test
```

---

## 🏗️ Build para Producción

### gym-admin

```bash
npm run gym-admin:build
# Output en: projects/gym-admin/dist/
```

### gym-app

```bash
npm run gym-app:build
# Output en: projects/gym-app/www/
```

### gym-library

```bash
npm run library:build
# Output en: dist/gym-library/
```

---

## 🛠️ Herramientas de Desarrollo Recomendadas

### IDE / Editor

- **Visual Studio Code** (recomendado)
  - Extensiones recomendadas:
    - Angular Language Service
    - Angular Snippets
    - Prettier - Code formatter
    - ESLint
    - Ionic
    - GitLens

### Extensiones de Navegador

- **Angular DevTools** (Chrome/Firefox)
- **Redux DevTools** (si usas NgRx)
- **Augury** (Angular debugging)

---

## 🔍 Verificación de Instalación

Ejecuta estos comandos para verificar que todo está correctamente instalado:

```bash
# Verificar versiones
node --version    # Debe ser >= v18
npm --version     # Debe ser >= v9
git --version     # Cualquier v2.x

# Verificar que Angular CLI funciona
npx ng version

# Verificar que Ionic CLI funciona (si está instalado)
ionic --version

# Verificar estructura del proyecto
ls -la projects/
# Deberías ver: gym-admin, gym-app, gym-library
```

---

## 📦 Estructura de Dependencias

### Versiones de Angular

| Proyecto | Angular | CLI | TypeScript |
|----------|---------|-----|------------|
| **Workspace** | 20.1.0 | 20.1.4 | 5.8.2 |
| **gym-admin** | 20.1.0 | 20.1.4 | 5.8.2 |
| **gym-app** | 20.0.0 | 20.0.0 | 5.8.0 |
| **gym-library** | 20.1.0 | 20.1.4 | 5.8.2 |

> ⚠️ **Nota**: gym-app está en Angular 20.0, mientras que el resto está en 20.1. Ver `SECURITY-RECOMMENDATIONS.md` para más detalles.

---

## ❌ Solución de Problemas Comunes

### Error: "Cannot find module 'gym-library'"

**Solución:**
```bash
npm run library:build
```

La librería debe compilarse antes de usarse en las apps.

### Error: Port 4200 o 8100 ya en uso

**Solución:**
```bash
# Matar proceso en puerto 4200
lsof -ti:4200 | xargs kill -9

# Matar proceso en puerto 8100
lsof -ti:8100 | xargs kill -9
```

O especifica otro puerto:
```bash
ng serve --port 4201
ionic serve --port 8101
```

### Error: "ng: command not found"

**Solución:**
```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli

# O usar npx
npx ng serve
```

### Error: "ionic: command not found"

**Solución:**
```bash
# Instalar Ionic CLI globalmente
npm install -g @ionic/cli
```

### Error al compilar TypeScript

**Solución:**
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
rm -rf projects/gym-admin/node_modules projects/gym-admin/package-lock.json
rm -rf projects/gym-app/node_modules projects/gym-app/package-lock.json
npm run install:all
```

### Error con Capacitor (gym-app)

**Solución:**
```bash
cd projects/gym-app
npx cap sync android
ionic cap copy android
ionic cap open android
```

---

## 🌳 Workflow de Git

### Ramas Principales

- `master` / `main` → Producción
- `develop` → Desarrollo
- `feature/*` → Nuevas funcionalidades
- `bugfix/*` → Corrección de bugs

### Flujo de Trabajo

```bash
# 1. Crear rama para nueva funcionalidad
git checkout -b feature/nombre-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat: descripción del cambio"

# 3. Push a tu rama
git push origin feature/nombre-funcionalidad

# 4. Crear Pull Request en GitHub
```

### Convención de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato (no afectan código)
refactor: refactorización de código
test: añadir o modificar tests
chore: cambios en configuración, dependencias, etc.
```

**Ejemplos:**
```bash
git commit -m "feat(gym-admin): añadir página de usuarios"
git commit -m "fix(gym-app): corregir error al guardar rutina"
git commit -m "docs: actualizar README con nuevos comandos"
```

---

## 🔐 Seguridad

### ⚠️ NUNCA hagas commit de:

- ❌ `**/environments/environment.ts`
- ❌ `**/environments/environment.prod.ts`
- ❌ `.env` files
- ❌ API keys o credenciales
- ❌ Archivos `firebase.json` con credenciales

### ✅ Antes de cada commit:

```bash
# Verificar que no hay credenciales
git diff

# Revisar archivos staged
git status

# Verificar el contenido antes de push
git show
```

---

## 📚 Recursos Adicionales

### Documentación del Proyecto

- [Documentación Principal](../README.md) - Índice completo de documentación
- [Modelo de Negocio](../business/model.md) - Estrategia y monetización
- [Recomendaciones de Seguridad](../security/recommendations.md) - Mejores prácticas
- [Guía de Desarrollo](../guides/development.md) - Comandos y workflow

### Documentación Oficial

- [Angular Documentation](https://angular.dev/)
- [Ionic Documentation](https://ionicframework.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Comunidad

- [Angular Discord](https://discord.gg/angular)
- [Ionic Forum](https://forum.ionicframework.com/)
- [Stack Overflow - Angular](https://stackoverflow.com/questions/tagged/angular)

---

## 👥 Equipo y Contacto

Si tienes problemas durante el setup o preguntas sobre el proyecto:

1. Revisa la sección de **Solución de Problemas** arriba
2. Busca en los [Issues de GitHub](https://github.com/sebasechazu/gym-workspace/issues)
3. Pregunta al líder del proyecto o al equipo

---

## ✅ Checklist de Setup Completado

Marca cada item cuando lo completes:

- [ ] Node.js y npm instalados y verificados
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm run install:all`)
- [ ] Variables de entorno configuradas (environment.ts)
- [ ] Credenciales de Firebase obtenidas y configuradas
- [ ] gym-library compilada exitosamente
- [ ] gym-admin corriendo en http://localhost:4200
- [ ] gym-app corriendo en http://localhost:8100
- [ ] Tests ejecutándose correctamente
- [ ] Git configurado con tu usuario
- [ ] VS Code con extensiones recomendadas instaladas
- [ ] Documentación leída (README.md, SECURITY-RECOMMENDATIONS.md)

---

**¡Listo para desarrollar! 🎉**

Si completaste todos los pasos, tu ambiente de desarrollo está configurado correctamente.

**Última actualización:** 5 de octubre de 2025
