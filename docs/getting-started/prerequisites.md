# 📋 Prerrequisitos - Gym Workspace

> Herramientas y dependencias necesarias antes de comenzar

## 🛠️ Requerimientos Obligatorios

### Node.js

**Versión mínima:** v18.x o superior (recomendado: v20.x LTS)

**Verificar instalación:**
```bash
node --version
# Debe mostrar: v18.x.x o superior
```

**Instalación:**
- **Opción 1 (Recomendada):** [nodejs.org](https://nodejs.org/) - Descarga el instalador LTS
- **Opción 2:** Usar un gestor de versiones como [nvm](https://github.com/nvm-sh/nvm)

```bash
# Con nvm (Linux/macOS)
nvm install 20
nvm use 20

# Con nvm-windows (Windows)
nvm install 20
nvm use 20.0.0
```

---

### npm

**Versión mínima:** v9.x o superior (incluido con Node.js)

**Verificar instalación:**
```bash
npm --version
# Debe mostrar: 9.x.x o superior
```

**Actualizar npm:**
```bash
npm install -g npm@latest
```

---

### Git

**Versión mínima:** v2.x o superior

**Verificar instalación:**
```bash
git --version
# Debe mostrar: git version 2.x.x
```

**Instalación:**
- **Windows:** [git-scm.com](https://git-scm.com/download/win)
- **macOS:** `brew install git` o Xcode Command Line Tools
- **Linux:** `sudo apt-get install git` (Ubuntu/Debian) o `sudo yum install git` (CentOS/RHEL)

**Configuración inicial:**
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 📱 Requerimientos para Desarrollo Móvil (gym-app)

### Ionic CLI

**Para:** Desarrollo y build de la aplicación móvil

**Instalación:**
```bash
npm install -g @ionic/cli
```

**Verificar instalación:**
```bash
ionic --version
# Debe mostrar: 7.x.x o superior
```

---

### Android Studio (para Android)

**Para:** Build y testing en Android

**Instalación:**
1. Descargar de [developer.android.com/studio](https://developer.android.com/studio)
2. Instalar Android Studio
3. Durante la instalación, asegurarse de instalar:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

**Configuración de Variables de Entorno:**

**Linux/macOS:**
```bash
# Agregar al ~/.bashrc o ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Windows:**
1. Panel de Control → Sistema → Configuración avanzada del sistema
2. Variables de entorno
3. Agregar:
   - `ANDROID_HOME`: `C:\Users\TuUsuario\AppData\Local\Android\Sdk`
   - Añadir a `PATH`: `%ANDROID_HOME%\platform-tools`

**Verificar instalación:**
```bash
adb --version
# Debe mostrar: Android Debug Bridge version x.x.x
```

---

### Java JDK

**Versión requerida:** JDK 17 (para Android)

**Verificar instalación:**
```bash
java -version
# Debe mostrar: openjdk version "17.x.x"
```

**Instalación:**
- **Opción 1:** [Adoptium (Eclipse Temurin)](https://adoptium.net/)
- **Opción 2:** [Oracle JDK](https://www.oracle.com/java/technologies/downloads/#java17)
- **Opción 3:** Instalar desde Android Studio (recomendado)

**macOS con Homebrew:**
```bash
brew install openjdk@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

---

## 🔧 Herramientas Recomendadas

### Visual Studio Code

**Para:** Editor de código principal

**Instalación:** [code.visualstudio.com](https://code.visualstudio.com/)

**Extensiones recomendadas:**
```json
{
  "recommendations": [
    "angular.ng-template",
    "johnpapa.angular2",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ionic.ionic",
    "eamodio.gitlens",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

Copia esto en `.vscode/extensions.json` del proyecto.

---

### Angular CLI (Opcional)

**Nota:** No es necesario instalarlo globalmente si usas `npx`, pero puede ser conveniente.

**Instalación global:**
```bash
npm install -g @angular/cli
```

**Verificar:**
```bash
ng version
```

**Uso sin instalación:**
```bash
npx ng serve
npx ng generate component mi-componente
```

---

## 🌐 Extensiones de Navegador

### Chrome / Edge

- **[Angular DevTools](https://chrome.google.com/webstore/detail/angular-devtools/)** - Debug de componentes Angular
- **[Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/)** - Si usas NgRx
- **[JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer/)** - Formateo de JSON

### Firefox

- **[Angular DevTools](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)** - Debug de componentes Angular

---

## 🔐 Acceso a Firebase

### Credenciales Requeridas

Para trabajar en el proyecto, necesitarás:

1. **Acceso a Firebase Console:** [console.firebase.google.com](https://console.firebase.google.com/)
2. **Credenciales del proyecto:** Solicitar al líder del proyecto
3. **Permisos adecuados:** Acceso de lectura/escritura según tu rol

**Proceso:**
1. Contactar al líder del proyecto ([@sebasechazu](https://github.com/sebasechazu))
2. Solicitar invitación al proyecto Firebase
3. Aceptar invitación en tu email
4. Obtener credenciales para `environment.ts`

---

## ✅ Checklist de Verificación

Antes de proceder con el [Setup](./setup.md), verifica que tienes:

**Obligatorios:**
- [ ] Node.js v18+ instalado (`node --version`)
- [ ] npm v9+ instalado (`npm --version`)
- [ ] Git v2+ instalado (`git --version`)
- [ ] Git configurado (user.name y user.email)
- [ ] Acceso al repositorio GitHub
- [ ] VS Code instalado (opcional pero recomendado)

**Para desarrollo móvil (gym-app):**
- [ ] Ionic CLI instalado (`ionic --version`)
- [ ] Android Studio instalado
- [ ] Java JDK 17 instalado (`java -version`)
- [ ] Variables de entorno ANDROID_HOME configuradas
- [ ] ADB funcionando (`adb --version`)

**Firebase:**
- [ ] Cuenta de Firebase/Google
- [ ] Acceso al proyecto solicitado
- [ ] Credenciales recibidas

---

## 🐛 Solución de Problemas

### Node.js/npm

**Problema:** Versión antigua de Node.js

**Solución:**
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js LTS
nvm install --lts
nvm use --lts
```

---

### Git

**Problema:** Git no reconocido en Windows

**Solución:**
1. Reinstalar Git asegurándose de marcar "Git from the command line"
2. Reiniciar terminal/PowerShell
3. Verificar con `git --version`

---

### Android Studio

**Problema:** ADB no encontrado

**Solución:**
```bash
# Verificar ANDROID_HOME
echo $ANDROID_HOME  # Linux/macOS
echo %ANDROID_HOME%  # Windows

# Reinstalar platform-tools si es necesario
sdkmanager "platform-tools"
```

**Problema:** Gradle build falla

**Solución:**
```bash
# Limpiar cache de Gradle
cd projects/gym-app/android
./gradlew clean

# Invalidar caches en Android Studio
# File > Invalidate Caches / Restart
```

---

### Permisos

**Problema:** Error EACCES al instalar paquetes globalmente

**Solución:**
```bash
# Opción 1: Usar nvm (recomendado)
# Instalar Node.js con nvm como se muestra arriba

# Opción 2: Cambiar directorio de npm global
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Node.js Documentation](https://nodejs.org/docs/)
- [npm Documentation](https://docs.npmjs.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Ionic CLI Documentation](https://ionicframework.com/docs/cli)

### Tutoriales

- [Angular Getting Started](https://angular.dev/tutorials/learn-angular)
- [Ionic Getting Started](https://ionicframework.com/getting-started)
- [Firebase Console Guide](https://firebase.google.com/docs/console)

---

## ➡️ Siguiente Paso

Una vez que tengas todo instalado y verificado, continúa con:

**[📖 Guía de Setup](./setup.md)** - Instalación y configuración del proyecto

---

**Última actualización:** Octubre 2025  
**Mantenido por:** [@sebasechazu](https://github.com/sebasechazu)
