# 📝 Guía de Documentación - Gym Library

Esta guía explica cómo mantener y actualizar la documentación de la librería Gym Library.

## 🎯 Estructura de Documentación

```
gym-library/
├── README.md                 # Documentación general y enlaces
├── typedoc.json             # Configuración de TypeDoc
├── docs/
│   └── api/                 # Documentación API generada automáticamente
├── coverage/                # Reportes de cobertura de tests
└── src/lib/                 # Código fuente con JSDoc
```

## 📖 Tipos de Documentación

### 1. Documentación de Código (JSDoc)

**Ubicación**: En los archivos TypeScript
**Propósito**: Documentar APIs públicas, parámetros, retornos y comportamiento

#### Estándares JSDoc

```typescript
/**
 * Descripción clara y concisa de la función
 * @param parametro - Descripción del parámetro
 * @returns Descripción de lo que retorna
 * @throws Error que puede lanzar
 */
function miFuncion(parametro: Tipo): Retorno {
  // implementación
}
```

#### Ejemplos en el código:

```typescript
/**
 * Busca un ejercicio por su ID en la lista cargada
 * @param id - Identificador único del ejercicio
 * @returns El ejercicio encontrado o null si no existe
 */
findEjercicioById(id: string): Ejercicio | null
```

### 2. Documentación API Automática (TypeDoc)

**Generación**: `npm run docs`
**Ubicación**: `docs/api/`
**Propósito**: Documentación navegable de toda la API pública

#### Comandos útiles:

```bash
# Generar documentación
npm run docs

# Generar y servir localmente
npm run docs:serve

# Limpiar documentación anterior
rm -rf docs/api && npm run docs
```

### 3. Documentación de Proyecto

**README.md**: Información general, instalación, uso básico
**docs/architecture/gym-library.md**: Arquitectura y decisiones técnicas
**docs/guides/**: Guías específicas de desarrollo

## 🔧 Mantenimiento de la Documentación

### Actualización automática

La documentación se actualiza automáticamente en:

1. **Build del proyecto**: Se ejecuta `npm run docs` en CI/CD
2. **Commits principales**: Actualización semanal de documentación
3. **Versiones**: Nueva documentación por versión release

### Checklist de actualización

Antes de hacer commit:

- [ ] JSDoc completo en métodos públicos nuevos
- [ ] Tests actualizados con nueva funcionalidad
- [ ] README actualizado si hay cambios en API
- [ ] Documentación generada: `npm run docs`

### Scripts disponibles

```json
{
  "docs": "typedoc",
  "docs:serve": "typedoc --serve",
  "test:coverage": "jest --coverage --verbose"
}
```

## 📊 Métricas de Calidad

### Cobertura de Tests
- **Objetivo**: >80% cobertura general
- **Crítico**: 100% en servicios principales
- **Comando**: `npm run test:coverage`

### Documentación
- **JSDoc**: 100% en APIs públicas
- **README**: Actualizado con cambios
- **TypeDoc**: Generado automáticamente

## 🚀 Mejores Prácticas

### JSDoc

1. **Idioma**: Español para descripciones
2. **Completitud**: `@param`, `@returns`, `@throws` cuando aplique
3. **Consistencia**: Formato uniforme en toda la librería
4. **Claridad**: Descripciones concisas pero completas

### Commits

```bash
# Para cambios de documentación
git commit -m "docs: actualizar JSDoc en EjercicioService"

# Para nueva documentación
git commit -m "docs: agregar guía de contribución"
```

### Code Reviews

- ✅ Verificar JSDoc en métodos nuevos
- ✅ Validar que `npm run docs` funciona
- ✅ Comprobar cobertura de tests
- ✅ README actualizado si es necesario

## 🔗 Enlaces Útiles

- [TypeDoc Documentation](https://typedoc.org/)
- [JSDoc Guide](https://jsdoc.app/)
- [Conventional Commits](https://conventionalcommits.org/)