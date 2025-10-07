# 💪 Entrenados - Features

> Listado de funcionalidades por plan

## 🔗 Modelo de Conexión

**Sistema de gestión por gimnasio:**

Los entrenados son gestionados a través del gimnasio al que pertenecen:

1. **Registro:** El gimnasio crea la cuenta del entrenado
2. **Asignación:** Se asigna opcionalmente a un entrenador específico
3. **Multi-tenancy:** Cada entrenado pertenece a un gimnasio (`gimnasioId`)
4. **Estado:** Se puede activar/desactivar (`activo: boolean`)

> **Importante:** El sistema usa multi-tenancy basado en `gimnasioId`.

## � Funcionalidades Actuales

### ✅ MVP Implementado

**Gestión de Entrenados:**
- CRUD completo de entrenados
- Filtrado por gimnasio
- Filtrado por objetivo (bajar peso, aumentar músculo, mantener peso)
- Filtrado por estado (activo/inactivo)
- Búsqueda por ID
- Contadores de total y activos

**Datos básicos:**
- ID único
- Gimnasio asociado
- Entrenador asignado (opcional)
- Estado activo/inactivo
- Fecha de registro
- Objetivo de entrenamiento

### 📋 Funcionalidades Planificadas

> Las siguientes funcionalidades están en el roadmap pero aún no implementadas:

**Rutinas y Entrenamientos:**
- Ver rutinas asignadas
- Registrar entrenamientos
- Historial de ejercicios
- Progreso por rutina

**Estadísticas:**
- Contador de rutinas completadas
- Racha de entrenamiento
- Records personales (PRs)

**Planes Free vs Premium:**
- Límites según plan
- Exportación PDF/Excel
- Estadísticas avanzadas

**Notificaciones:**
- Push notifications
- Recordatorios
- Alertas de progreso

## 🎯 Roadmap de Funcionalidades

> **Estado actual:** MVP básico de gestión de entrenados

### Fase 1: MVP ✅ (Implementado)
- [x] Modelo básico de Entrenado
- [x] Servicio con signals reactivas
- [x] CRUD completo
- [x] Filtros por gimnasio, objetivo, estado
- [x] Contadores y estadísticas básicas

### Fase 2: Rutinas y Entrenamientos 📋 (Planificado)
- [ ] Modelo RutinaAsignada
- [ ] Modelo RegistroEntrenamiento
- [ ] Vista de rutinas asignadas
- [ ] Iniciar y completar entrenamientos
- [ ] Registrar series, reps y peso
- [ ] Progreso por rutina (%)

### Fase 3: Estadísticas 📋 (Planificado)
- [ ] Racha de entrenamientos
- [ ] Records personales (PRs)
- [ ] Historial de entrenamientos
- [ ] Gráficas de progreso
- [ ] Volumen total levantado

### Fase 4: Planes y Premium 📋 (Planificado)
- [ ] Diferenciación Free vs Premium
- [ ] Límites por plan (historial, etc.)
- [ ] Exportación PDF/Excel
- [ ] Sin watermark para Premium

### Fase 5: Notificaciones 📋 (Planificado)
- [ ] Push notifications (FCM)
- [ ] Recordatorios de entrenamiento
- [ ] Alertas de logros
- [ ] Resumen semanal

---

**Ver también:**
- [Especificaciones Técnicas](technical.md)
- [Entrenadores](../trainers/features.md)
- [Gimnasios](../gyms/features.md)
