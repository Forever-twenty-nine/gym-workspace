# 🔒 Recomendaciones de Seguridad y Mejores Prácticas

> ⚠️ **IMPORTANTE**: Este documento contiene recomendaciones críticas de seguridad que deben implementarse antes de pasar a producción.

## 📋 Estado Actual del Proyecto

### Problemas Identificados

- ❌ API Keys de Firebase expuestas en el código fuente
- ❌ Mismas credenciales usadas en desarrollo y producción
- ❌ Variables de entorno compartidas en la librería (mal patrón de diseño)
- ❌ Credenciales versionadas en Git
- ❌ Sin separación de proyectos Firebase por ambiente

---

## 🚨 Prioridad CRÍTICA - Seguridad de Credenciales

### 1. Rotar Credenciales de Firebase

**¿Por qué?** Las API keys actuales están expuestas públicamente en GitHub.

**Pasos:**

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto: `gym-app-81f5c`
3. Ir a **Project Settings** > **General**
4. En la sección de aplicaciones web:
   - **Eliminar** la app web actual
   - **Crear** una nueva app web
   - Obtener las nuevas credenciales
5. Configurar **restricciones de dominio** para las API keys:
   - Settings > Cloud Platform > API Keys
   - Restringir por dominio (localhost, tu-dominio.com)

### 2. Crear Proyectos Firebase Separados

**Estructura recomendada:**

```
gym-app-dev     → Para desarrollo y testing
gym-app-staging → Para pruebas pre-producción (opcional)
gym-app-prod    → Para producción (usuarios reales)
```

**Beneficios:**

- ✅ Datos de prueba separados de datos reales
- ✅ Mayor seguridad
- ✅ Facilita testing sin afectar producción
- ✅ Mejor control de costos por ambiente

---

## 🏗️ Refactorización de Arquitectura

### 3. Eliminar Variables de Entorno de la Librería

**Problema actual:**

```
gym-library/
  └── environments/
      ├── environment.ts      ❌ NO debería estar aquí
      └── environment.prod.ts ❌ NO debería estar aquí
```

**Solución:**

La librería (`gym-library`) **SOLO** debe contener:

- ✅ Interfaces y tipos (`Environment`, `FirebaseConfig`)
- ✅ Servicios reutilizables
- ✅ Componentes compartidos
- ✅ Utilidades y helpers

**NO debe contener:**

- ❌ Configuración específica del entorno
- ❌ API keys o secretos
- ❌ URLs de servicios concretos

**Archivos a eliminar de gym-library:**

```bash
projects/gym-library/src/lib/environments/environment.ts
projects/gym-library/src/lib/environments/environment.prod.ts
```

**Archivos a mantener en gym-library:**

```typescript
// projects/gym-library/src/lib/models/environment.model.ts
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface Environment {
  production: boolean;
  firebase: FirebaseConfig;
}
```

### 4. Mover Configuración a Cada Aplicación

**Nueva estructura:**

```
gym-admin/
  └── src/
      └── environments/
          ├── environment.development.ts  ← Config de desarrollo
          ├── environment.staging.ts      ← Config de staging (opcional)
          └── environment.production.ts   ← Config de producción

gym-app/
  └── src/
      └── environments/
          ├── environment.development.ts  ← Config de desarrollo
          ├── environment.staging.ts      ← Config de staging (opcional)
          └── environment.production.ts   ← Config de producción
```

---

## 🔐 Protección de Credenciales

### 5. Actualizar .gitignore

**Agregar al .gitignore principal:**

```gitignore
# Environment files con credenciales reales
**/environments/environment.development.ts
**/environments/environment.staging.ts
**/environments/environment.production.ts
**/environments/environment.*.ts

# Archivos de variables de entorno
.env
.env.local
.env.development
.env.staging
.env.production
.env.*.local

# Archivos de configuración sensibles
firebase.json
.firebaserc

# Claves y certificados
*.pem
*.key
*.cert
*.p12
*.jks
google-services.json
GoogleService-Info.plist
```

### 6. Crear Archivos Template

**Crear archivos de plantilla para cada app:**

```typescript
// gym-admin/src/environments/environment.development.template.ts
import { Environment } from 'gym-library';

export const environment: Environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_DEV_API_KEY_HERE',
    authDomain: 'your-project-dev.firebaseapp.com',
    projectId: 'your-project-dev',
    storageBucket: 'your-project-dev.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
};
```

```typescript
// gym-admin/src/environments/environment.production.template.ts
import { Environment } from 'gym-library';

export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'YOUR_PROD_API_KEY_HERE',
    authDomain: 'your-project-prod.firebaseapp.com',
    projectId: 'your-project-prod',
    storageBucket: 'your-project-prod.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
    measurementId: 'YOUR_MEASUREMENT_ID',
  },
};
```

**Instrucciones para otros desarrolladores:**

Crear un `SETUP.md`:

```markdown
## Setup para Desarrolladores

1. Copia los archivos template:
   ```bash
   cp projects/gym-admin/src/environments/environment.development.template.ts \
      projects/gym-admin/src/environments/environment.development.ts
   
   cp projects/gym-app/src/environments/environment.development.template.ts \
      projects/gym-app/src/environments/environment.development.ts
   ```

2. Solicita las credenciales de Firebase DEV al líder del proyecto

3. Reemplaza los valores en los archivos copiados

4. NUNCA hagas commit de estos archivos
```

---

## 🔧 Uso de Variables de Entorno (Opción Avanzada)

### 7. Configurar Variables de Entorno en CI/CD

Para producción, usar variables de entorno en lugar de archivos:

**GitHub Actions example:**

```yaml
# .github/workflows/deploy.yml
- name: Create environment file
  run: |
    cat > projects/gym-admin/src/environments/environment.production.ts << EOF
    export const environment = {
      production: true,
      firebase: {
        apiKey: '${{ secrets.FIREBASE_API_KEY }}',
        authDomain: '${{ secrets.FIREBASE_AUTH_DOMAIN }}',
        projectId: '${{ secrets.FIREBASE_PROJECT_ID }}',
        storageBucket: '${{ secrets.FIREBASE_STORAGE_BUCKET }}',
        messagingSenderId: '${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}',
        appId: '${{ secrets.FIREBASE_APP_ID }}',
        measurementId: '${{ secrets.FIREBASE_MEASUREMENT_ID }}'
      }
    };
    EOF
```

**Secrets a configurar en GitHub:**

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

---

## 🧹 Limpieza del Historial de Git

### 8. Remover Credenciales del Historial (OPCIONAL)

⚠️ **ADVERTENCIA**: Esto reescribe el historial de Git. Todos los colaboradores deberán hacer fresh clone.

**Opción 1: BFG Repo-Cleaner (recomendado)**

```bash
# Instalar BFG
brew install bfg  # macOS
# o descargar de: https://rtyley.github.io/bfg-repo-cleaner/

# Crear backup
git clone --mirror git@github.com:sebasechazu/gym-workspace.git gym-workspace-backup.git

# Limpiar archivos sensibles
bfg --delete-files environment.ts gym-workspace.git
bfg --delete-files environment.prod.ts gym-workspace.git

# Limpiar y forzar push
cd gym-workspace.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Opción 2: git filter-branch**

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch \
    projects/gym-library/src/lib/environments/environment.ts \
    projects/gym-library/src/lib/environments/environment.prod.ts \
    projects/gym-admin/src/environments/environment.ts \
    projects/gym-admin/src/environments/environment.prod.ts \
    projects/gym-app/src/environments/environment.ts \
    projects/gym-app/src/environments/environment.prod.ts" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

---

## 🔍 Auditoría de Seguridad

### 9. Verificar que No Haya Otras Credenciales Expuestas

```bash
# Buscar posibles API keys
git grep -i "api_key\|apikey\|api-key" -- "*.ts" "*.js" "*.json"

# Buscar tokens
git grep -i "token\|secret\|password\|credential" -- "*.ts" "*.js" "*.json"

# Buscar URLs de servicios
git grep -E "https?://[^/]*\.(firebase|google)" -- "*.ts" "*.js"
```

### 10. Herramientas de Seguridad

**Instalar y ejecutar:**

```bash
# Detectar secretos en el código
npm install -D @secretlint/secretlint-rule-preset-recommend
npx secretlint "**/*"

# Auditar dependencias
npm audit
npm audit fix

# Verificar licencias
npx license-checker --summary
```

---

## 📚 Mejores Prácticas de Seguridad

### Reglas Generales

1. ✅ **NUNCA** hagas commit de:
   - API keys
   - Tokens de acceso
   - Contraseñas
   - Certificados
   - Claves privadas

2. ✅ **SIEMPRE** usa:
   - Variables de entorno
   - Servicios de gestión de secretos (AWS Secrets Manager, Google Secret Manager)
   - Archivos `.gitignore` adecuados

3. ✅ **ROTAR** credenciales:
   - Si se exponen por error
   - Cada 90 días (producción)
   - Al salir un miembro del equipo con acceso

4. ✅ **SEPARAR** ambientes:
   - Desarrollo ≠ Producción
   - Diferentes proyectos Firebase
   - Diferentes bases de datos

5. ✅ **AUDITAR** regularmente:
   - Revisar logs de acceso
   - Verificar permisos de Firebase
   - Ejecutar `npm audit`

---

## ✅ Checklist de Implementación

### Fase 1: Preparación (Antes de Producción)

- [ ] Rotar API keys de Firebase
- [ ] Crear proyectos Firebase separados (dev/staging/prod)
- [ ] Obtener nuevas credenciales para cada ambiente

### Fase 2: Refactorización de Código

- [ ] Eliminar `environments/` de `gym-library`
- [ ] Crear archivos `environment.*.template.ts` en cada app
- [ ] Actualizar imports en el código para usar environments locales
- [ ] Actualizar `public-api.ts` de gym-library (quitar exports de environments)

### Fase 3: Configuración de Git

- [ ] Actualizar `.gitignore`
- [ ] Crear archivos template
- [ ] Documentar setup en `SETUP.md`
- [ ] Limpiar historial de Git (opcional)

### Fase 4: Configuración de CI/CD

- [ ] Configurar secrets en GitHub Actions
- [ ] Crear workflows para cada ambiente
- [ ] Probar deployment en staging
- [ ] Validar que no haya credenciales en logs

### Fase 5: Documentación y Capacitación

- [ ] Documentar proceso de configuración
- [ ] Capacitar al equipo en mejores prácticas
- [ ] Establecer políticas de seguridad
- [ ] Configurar alertas de seguridad

---

## 📖 Recursos Adicionales

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Angular Environment Variables](https://angular.dev/tools/cli/environments)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Git Secrets Prevention](https://git-secret.io/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

---

## 🤝 Responsabilidades

### Desarrolladores

- No hacer commit de credenciales
- Usar archivos template
- Reportar exposiciones accidentales
- Mantener dependencias actualizadas

### Tech Lead / Líder del Proyecto

- Gestionar credenciales de producción
- Configurar CI/CD con secrets
- Auditar código regularmente
- Rotar credenciales periódicamente

### DevOps / Admin

- Configurar servicios de secretos
- Monitorear logs de acceso
- Gestionar permisos de Firebase
- Implementar políticas de seguridad

---

## 📞 Contacto en Caso de Incidente de Seguridad

Si descubres credenciales expuestas o un problema de seguridad:

1. **NO** hagas commit/push del hallazgo
2. Notifica inmediatamente al líder del proyecto
3. Rota las credenciales afectadas
4. Documenta el incidente
5. Implementa medidas preventivas

---

**Última actualización:** 5 de octubre de 2025  
**Estado:** Pendiente de implementación  
**Prioridad:** 🔴 CRÍTICA

