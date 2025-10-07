# 📋 Funcionalidades

> Especificaciones técnicas y funcionales por tipo de usuario

## 📂 Estructura

Este directorio contiene la documentación funcional de la aplicación, organizada por tipo de usuario con **dos archivos por categoría**:

### � Trainees (Usuarios Entrenados)
- **[trainees/features.md](trainees/features.md)** - Funcionalidades, UI mockups, planes
- **[trainees/technical.md](trainees/technical.md)** - Modelos de datos, APIs, implementación

### 👨‍🏫 Trainers (Entrenadores)
- **[trainers/features.md](trainers/features.md)** - Funcionalidades, dashboard, herramientas
- **[trainers/technical.md](trainers/technical.md)** - Modelos de datos, APIs, marketplace

### 🏢 Gyms (Gimnasios B2B)
- **[gyms/features.md](gyms/features.md)** - Funcionalidades empresariales, analytics, branding
- **[gyms/technical.md](gyms/technical.md)** - Multi-tenancy, APIs, webhooks, integraciones

## 🎯 Propósito

Esta documentación está **enfocada en el desarrollo**, separando claramente:

### 📋 Archivos `features.md`
Responden: **¿Qué hace la app?**

- ✅ Listado de funcionalidades por plan (Free/Premium/Business)
- ✅ UI mockups (ASCII art)
- ✅ Flujos de usuario
- ✅ Comparativas de planes
- ✅ Especificaciones de notificaciones
- ✅ Roadmap de features

### ⚙️ Archivos `technical.md`
Responden: **¿Cómo se implementa?**

- ✅ Modelos de datos (TypeScript interfaces)
- ✅ Schemas de base de datos (SQL)
- ✅ API endpoints (request/response)
- ✅ Autenticación y middleware
- ✅ Webhooks y notificaciones push
- ✅ Cron jobs
- ✅ Tests y performance

## ❌ No incluye

Esta documentación **NO incluye**:
- Marketing o descripciones comerciales
- Precios o modelos de monetización
- Información de ventas o ROI
- Competencia o análisis de mercado

> Para información de negocio, ver [/docs/business/](../business/)

## 📖 Cómo usar

### Para desarrolladores frontend:
1. Lee los archivos `features.md` para entender la funcionalidad
2. Usa los mockups como guía de UI/UX
3. Consulta `technical.md` para entender los datos disponibles

### Para desarrolladores backend:
1. Lee los archivos `technical.md` para modelos y APIs
2. Implementa según las interfaces TypeScript
3. Sigue las especificaciones de endpoints

### Para product managers:
1. Revisa los archivos `features.md` para features por plan
2. Valida que los mockups reflejen la visión del producto
3. Prioriza features del roadmap

## 🔗 Modelo de Conexión

**Importante:** La app **NO es una red social**. Usa un sistema basado en **invitaciones privadas**:

- **Trainers → Trainees:** Invitación por email con token único
- **Gyms → Trainers:** Invitación para unirse al equipo
- **No hay búsqueda pública ni perfiles visibles**

Ver detalles en cada archivo de features.

## 🔗 Enlaces Relacionados

- [Modelo General](../business/model.md) - Resumen ejecutivo y arquitectura
- [Pricing](../business/pricing.md) - Información de precios y monetización
- [Arquitectura](../architecture/overview.md) - Documentación técnica del sistema

---

**Última actualización:** Marzo 2025
