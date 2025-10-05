# 🚀 Comandos de Desarrollo - Gym Workspace

## 📋 Comandos Principales

### 🎯 Desarrollo Completo (Recomendado)

```bash
npm run dev
```
**¿Qué hace?**
1. ✅ Compila la librería `gym-library` una vez
2. ✅ Inicia `gym-admin` en modo desarrollo
3. ✅ Inicia `gym-app` en modo desarrollo
4. ✅ Ejecuta ambas apps en paralelo

**Puertos:**
- 🖥️ **gym-admin**: http://localhost:4200
- 📱 **gym-app**: http://localhost:8100

---

### 🔄 Desarrollo con Hot Reload de Librería

```bash
npm run dev:all
```
**¿Qué hace?**
1. ✅ Compila la librería `gym-library` en modo **watch** (detecta cambios automáticamente)
2. ✅ Inicia `gym-admin` en modo desarrollo
3. ✅ Inicia `gym-app` en modo desarrollo
4. ✅ Las apps se recargan automáticamente cuando cambias la librería

**Usa este comando cuando estés trabajando en:**
- Cambios en `gym-library`
- Cambios que afecten tanto la librería como las apps

---

## 🎨 Comandos Individuales

### 📚 Librería (gym-library)

```bash
# Compilar una vez
npm run library:build

# Compilar en modo watch (detecta cambios)
npm run library:watch

# Ejecutar tests
npm run library:test
```

---

### 🖥️ Admin (gym-admin)

```bash
# Iniciar en desarrollo
npm run gym-admin:serve

# Compilar para producción
npm run gym-admin:build

# Ejecutar tests
npm run gym-admin:test
```

**Puerto:** http://localhost:4200

---

### 📱 App (gym-app)

```bash
# Iniciar en desarrollo
npm run gym-app:serve

# Compilar para producción
npm run gym-app:build

# Sincronizar con Capacitor
npm run gym-app:sync

# Ejecutar en Android
npm run gym-app:android
```

**Puerto:** http://localhost:8100

---

## 🔧 Comandos de Utilidad

### Instalar todas las dependencias

```bash
npm run install:all
```
Instala dependencias en:
- Workspace raíz
- gym-admin
- gym-app
- gym-library

---

## 🎯 Workflow Recomendado

### Desarrollo Normal
```bash
npm run dev
```

### Trabajando en la Librería
```bash
npm run dev:all
```

### Primera vez / Después de git pull
```bash
npm run install:all
npm run dev
```

---

## 📊 Colores de Logs

Cuando uses `npm run dev` o `npm run dev:all`, verás logs con colores:

- 🟡 **[lib]** - gym-library (solo en dev:all)
- 🔵 **[admin]** - gym-admin
- 🟣 **[app]** - gym-app

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'gym-library'"
```bash
npm run library:build
```

### Las apps no se actualizan después de cambiar la librería
```bash
# Detén el servidor actual (Ctrl+C)
npm run library:build
npm run dev
```

### Puerto en uso
```bash
# Detén todos los procesos de Node
pkill -f "node"

# O busca y mata el proceso específico
lsof -ti:4200 | xargs kill  # gym-admin
lsof -ti:8100 | xargs kill  # gym-app
```

---

## ✅ Checklist Antes de Hacer Push

- [ ] `npm run library:build` sin errores
- [ ] `npm run gym-admin:build` sin errores
- [ ] `npm run gym-app:build` sin errores
- [ ] Tests pasando
- [ ] Cambios probados en ambas apps

---

**💡 Tip:** Usa `Ctrl+C` para detener todos los servidores cuando uses los comandos paralelos.
