# 📚 Gym Library

Librería compartida entre gym-admin y gym-app.

## 📚 Documentación

La documentación completa está disponible en:

👉 **[/docs/architecture/gym-library.md](../../docs/architecture/gym-library.md)**

### 📖 Documentación Técnica

- **[Documentación API](docs/api/)** - Generada automáticamente con TypeDoc
- **[Guías de Desarrollo](../../docs/guides/)** - Guías específicas del proyecto
- **[Cobertura de Tests](coverage/lcov-report/)** - Reporte de cobertura actual

## 🔧 Build

```bash
# Desde la raíz del workspace
npm run library:build

# Watch mode
npm run library:watch
```

## 📊 Calidad del Código

- ✅ **78 tests** pasando
- 📈 **Cobertura promedio**: 85% (AuthService), 77% (EjercicioService), 95% (UserService)
- 🎯 **JSDoc completo** en servicios principales
- 🔒 **TypeScript strict** habilitado

Ver [Guía de Desarrollo](../../docs/guides/development.md) para más información.
