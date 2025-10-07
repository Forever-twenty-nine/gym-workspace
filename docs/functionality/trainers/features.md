# 👨‍🏫 Entrenadores - Features

> Listado de funcionalidades por plan

## 🔗 Modelo de Trabajo

**Sistema de invitación de clientes:**

El entrenador gestiona su base de clientes mediante invitaciones:

1. **Generar invitación:** Crear link único con token
2. **Enviar email:** Sistema envía email automático al cliente
3. **Cliente se registra:** Usando el link de invitación
4. **Vinculación automática:** Cliente queda conectado al entrenador

> **Importante:** No hay directorios públicos ni búsqueda de entrenadores.

## 🆓 Plan Free

### ✅ Funcionalidades Incluidas

**Gestión de Clientes:**
- Invitar clientes por email (máximo 3 activos)
- Ver lista de clientes activos/inactivos
- Ver perfil básico de cliente
- Ver última actividad de cliente

**Rutinas:**
- Crear rutinas personalizadas (máximo 5 activas)
- Editor de rutinas con biblioteca de ejercicios
- Asignar rutinas a clientes
- Ver progreso básico de cliente por rutina

**Dashboard:**
- Vista general de clientes
- Rutinas creadas (count)
- Actividad reciente

### ❌ Restricciones

- Máximo 3 clientes activos simultáneos
- Máximo 5 rutinas activas (borrador o publicadas)
- Sin chat en tiempo real
- Sin calendario integrado
- Sin estadísticas avanzadas por cliente
- Sin branding personalizado
- Sin acceso a marketplace
- Sin exportación de reportes

## 💼 Plan Pro

### ✅ Todo lo de Free +

**Gestión Ilimitada:**
- Clientes ilimitados
- Rutinas ilimitadas
- Carpetas y organización de rutinas

**Comunicación:**
- Chat en tiempo real con clientes
- Videollamadas programadas (integración)
- Notas privadas por cliente
- Historial de conversaciones

**Calendario:**
- Calendario integrado
- Programar sesiones presenciales/online
- Recordatorios automáticos
- Sincronización con Google Calendar

**Analytics Avanzados:**
- Dashboard completo por cliente
- Métricas de adherencia detalladas
- Gráficas de progreso temporal
- Comparativas entre clientes
- Reportes automáticos generados

**Branding:**
- Subir logo personalizado
- Logo en rutinas exportadas por clientes
- Perfil profesional completo
- Portfolio de casos de éxito
- Badge "PRO" en perfil

**Marketplace:**
- Publicar rutinas para vender
- Crear bundles y paquetes
- Fijar precios personalizados
- Dashboard de ventas e ingresos
- Comisión: 70% entrenador, 30% plataforma

**Herramientas Profesionales:**
- Plantillas de rutinas
- Copiar y adaptar rutinas existentes
- Exportar reportes de clientes (PDF)
- Biblioteca de ejercicios personalizada

## 📊 Dashboard del Entrenador

### Vista Principal

**Panel de Control:**
```
┌─────────────────────────────────────────┐
│  👋 Bienvenido, Coach Juan              │
│  📊 Plan: Pro                           │
├─────────────────────────────────────────┤
│  RESUMEN                                │
│  👥 12 clientes activos                 │
│  📋 24 rutinas creadas                  │
│  📈 89% adherencia promedio             │
│  💰 $450 ingresos este mes              │
├─────────────────────────────────────────┤
│  ⚠️ ALERTAS                              │
│  • Ana - Sin entrenar 5 días            │
│  • Pedro - Completó rutina ✅           │
│  • Laura - Nuevo mensaje 💬             │
├─────────────────────────────────────────┤
│  ACCIONES RÁPIDAS                       │
│  [➕ Nuevo Cliente] [📋 Nueva Rutina]   │
│  [📅 Ver Calendario] [💬 Mensajes]      │
└─────────────────────────────────────────┘
```

### Lista de Clientes

**Vista de tabla:**
```
┌──────────┬────────────┬────────────┬──────────┬────────┐
│ Cliente  │ Rutina     │ Progreso   │ Última   │ Estado │
│          │ Actual     │            │ Sesión   │        │
├──────────┼────────────┼────────────┼──────────┼────────┤
│ 👤 Ana   │ Full Body  │ ████░ 80%  │ Ayer     │ 🟢     │
│ López    │            │ 4/5 días   │          │ Activo │
├──────────┼────────────┼────────────┼──────────┼────────┤
│ 👤 Pedro │ Hipertrofia│ ██░░░ 40%  │ Hace 2d  │ 🟢     │
│ García   │            │ 2/5 días   │          │ Activo │
├──────────┼────────────┼────────────┼──────────┼────────┤
│ 👤 Laura │ Cardio     │ ░░░░░ 0%   │ Hace 7d  │ 🔴     │
│ Martín   │            │ 0/4 días   │          │ Alert  │
└──────────┴────────────┴────────────┴──────────┴────────┘

[Ver detalles] [💬 Chat] [📋 Asignar]
```

**Filtros disponibles:**
- Todos / Activos / Inactivos
- Por rutina asignada
- Por adherencia (alta/media/baja)
- Búsqueda por nombre

### Perfil de Cliente (Detalle)

**Información:**
```
┌─────────────────────────────────────────┐
│  👤 ANA LÓPEZ                           │
│  📧 ana@email.com                       │
│  📅 Cliente desde: Enero 2025           │
│  📍 Plan: Premium                       │
├─────────────────────────────────────────┤
│  MÉTRICAS (Últimos 30 días)            │
│  🏋️ 18 entrenamientos                   │
│  📊 85% adherencia                      │
│  🔥 Racha: 12 días                      │
│  💪 Volumen: 14,500kg                   │
├─────────────────────────────────────────┤
│  RUTINA ACTUAL                          │
│  📋 Full Body 3x/semana                 │
│  ✅ Progreso: 80% (4/5 días)            │
│  📅 Asignada: Hace 2 semanas            │
│                                         │
│  [Cambiar Rutina] [Ver Progreso]       │
├─────────────────────────────────────────┤
│  HISTORIAL DE RUTINAS                  │
│  • Full Body 3x → Actual                │
│  • Principiante → Completada            │
│                                         │
│  [Ver Todo]                             │
├─────────────────────────────────────────┤
│  NOTAS PRIVADAS (Solo Pro)             │
│  "Objetivo: bajar 5kg en 2 meses"      │
│  "Limitación: problema rodilla izq"     │
│                                         │
│  [Editar Notas]                         │
├─────────────────────────────────────────┤
│  [💬 Abrir Chat] [📊 Reportes]          │
│  [📧 Enviar Email] [🔕 Desactivar]      │
└─────────────────────────────────────────┘
```

## 📝 Creador de Rutinas

### Editor Visual

**Interfaz:**
```
┌─────────────────────────────────────────┐
│  NUEVA RUTINA                           │
├─────────────────────────────────────────┤
│  Título: [________________]             │
│  Descripción: [________________]        │
│  Dificultad: ○ Principiante             │
│             ● Intermedio                │
│              ○ Avanzado                 │
│  Duración est: [45] minutos             │
│  Categoría: [Fuerza ▼]                  │
├─────────────────────────────────────────┤
│  EJERCICIOS                             │
│                                         │
│  1. 🏋️ Press de Banca                   │
│     Series: 4 | Reps: 10 | Peso: 60kg  │
│     Descanso: 90s                       │
│     [🎥 Video] [📝 Notas] [🗑️ Eliminar]│
│                                         │
│  2. 🏋️ Sentadillas                      │
│     Series: 3 | Reps: 12 | Peso: 80kg  │
│     Descanso: 120s                      │
│     [🎥 Video] [📝 Notas] [🗑️ Eliminar]│
│                                         │
│  [➕ Agregar Ejercicio]                 │
│                                         │
│  ╔════════════════════════════════════╗ │
│  ║ BIBLIOTECA DE EJERCICIOS           ║ │
│  ║ 🔍 Buscar...                       ║ │
│  ║                                    ║ │
│  ║ 💪 Pecho                           ║ │
│  ║   • Press banca                    ║ │
│  ║   • Press inclinado                ║ │
│  ║   • Aperturas                      ║ │
│  ║                                    ║ │
│  ║ 🦵 Piernas                         ║ │
│  ║   • Sentadillas                    ║ │
│  ║   • Prensa                         ║ │
│  ║   • Zancadas                       ║ │
│  ╚════════════════════════════════════╝ │
│                                         │
│  [💾 Guardar Borrador] [✅ Publicar]    │
└─────────────────────────────────────────┘
```

**Características:**
- Drag & drop para reordenar ejercicios
- Búsqueda en biblioteca de 500+ ejercicios
- Filtros: grupo muscular, equipo necesario
- Preview en tiempo real
- Duplicar ejercicio
- Plantillas predefinidas (Pro)

## 💬 Chat en Tiempo Real (Pro)

### Interfaz de Chat

```
┌─────────────────────────────────────────┐
│  💬 Conversaciones                      │
├─────────────────────────────────────────┤
│  👤 Ana López            ● Online       │
│     "¿Puedo cambiar..."  Hace 5min      │
├─────────────────────────────────────────┤
│  👤 Pedro García         ⚫ Offline      │
│     "Gracias!"           Ayer           │
├─────────────────────────────────────────┤
│  👤 Laura Martín         ⚫ Offline      │
│     "Ok, entendido"      Hace 2 días    │
└─────────────────────────────────────────┘

CONVERSACIÓN CON ANA LÓPEZ
┌─────────────────────────────────────────┐
│  Ana (Cliente)          escribiendo...  │
├─────────────────────────────────────────┤
│                                         │
│  [Ana] Hace 10min                       │
│  Hola! Tengo una duda sobre el press   │
│  de banca, ¿puedo usar mancuernas?     │
│                                         │
│              [Tú] Hace 5min             │
│              ¡Claro! De hecho es una    │
│              excelente variación 💪     │
│                                         │
│  [Ana] escribiendo...                   │
│                                         │
├─────────────────────────────────────────┤
│  [Escribir mensaje...]                  │
│  📎 📷 [Enviar]                          │
└─────────────────────────────────────────┘
```

**Features:**
- Estado online/offline en tiempo real
- Indicador "escribiendo..."
- Enviar imágenes/videos
- Notificaciones push si offline
- Historial completo
- Marcar como leído

## 📅 Calendario Integrado (Pro)

### Vista de Calendario

```
        MARZO 2025
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Dom │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│     │ 🏋️  │     │ 🏋️  │     │ 🏋️  │     │
│     │10am │     │10am │     │10am │     │
│     │Ana  │     │Pedro│     │Laura│     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  8  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │
│     │ 🏋️  │     │ 💻  │     │ 🏋️  │     │
│     │10am │     │4pm  │     │10am │     │
│     │Ana  │     │Zoom │     │Ana  │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Tipos de eventos:**
- 🏋️ Sesión presencial
- 💻 Consulta online
- 📋 Revisión de progreso
- ⏰ Recordatorio

**Funcionalidades:**
- Crear/editar/eliminar eventos
- Asignar a cliente específico
- Notificación automática 24h antes
- Exportar a Google Calendar
- Vista día/semana/mes

## 🛒 Marketplace de Rutinas (Pro)

### Publicar Rutina

```
┌─────────────────────────────────────────┐
│  VENDER RUTINA EN MARKETPLACE           │
├─────────────────────────────────────────┤
│  Rutina: [Full Body Principiante ▼]    │
│  Precio: $[20] USD                      │
│  Categoría: [Fuerza ▼]                  │
│  Nivel: [Principiante ▼]                │
│                                         │
│  Descripción para compradores:          │
│  [____________________________]         │
│  [____________________________]         │
│                                         │
│  Preview público: ☑️ Mostrar preview    │
│  ¿Incluir videos?: ☑️ Sí                │
│                                         │
│  [📤 Publicar en Marketplace]           │
└─────────────────────────────────────────┘
```

### Dashboard de Ventas

```
┌─────────────────────────────────────────┐
│  💰 INGRESOS DEL MES                    │
│  $450 USD (70% de $643 en ventas)       │
├─────────────────────────────────────────┤
│  RUTINAS PUBLICADAS (3)                 │
│                                         │
│  📋 Full Body Principiante              │
│     Precio: $20 | Ventas: 12            │
│     Ingresos: $168 (70% de $240)        │
│     ⭐ 4.8 (24 reviews)                  │
│                                         │
│  📋 Hipertrofia 5 días                  │
│     Precio: $35 | Ventas: 8             │
│     Ingresos: $196 (70% de $280)        │
│     ⭐ 4.9 (15 reviews)                  │
│                                         │
│  [Ver Todas] [Nueva Rutina]             │
├─────────────────────────────────────────┤
│  SOLICITAR RETIRO                       │
│  Disponible: $450                       │
│  [💳 Retirar a cuenta bancaria]         │
└─────────────────────────────────────────┘
```

## 📊 Analytics por Cliente (Pro)

### Reportes Detallados

```
┌─────────────────────────────────────────┐
│  📊 REPORTE: ANA LÓPEZ                  │
│  Período: Últimos 30 días               │
├─────────────────────────────────────────┤
│  ADHERENCIA                             │
│  ████████████░░ 85% (17/20 días)        │
│                                         │
│  📈 Gráfica de adherencia semanal       │
│  [Gráfico de línea]                     │
├─────────────────────────────────────────┤
│  VOLUMEN DE ENTRENAMIENTO               │
│  Total levantado: 14,500 kg             │
│                                         │
│  📊 Por grupo muscular:                 │
│  Pecho:   3,200kg ████████░             │
│  Espalda: 4,100kg ██████████░           │
│  Piernas: 5,800kg ████████████          │
│  Hombros: 1,400kg ███░                  │
├─────────────────────────────────────────┤
│  PERSONAL RECORDS                       │
│  🏆 Press Banca: 65kg (↑5kg)            │
│  🏆 Sentadilla: 90kg (↑10kg)            │
├─────────────────────────────────────────┤
│  [📥 Exportar PDF] [📧 Enviar a Cliente]│
└─────────────────────────────────────────┘
```

## 🎓 Sistema de Certificación

### Niveles y Requisitos

**🥉 Verificado:**
- 10 rutinas creadas
- 3 clientes activos
- Rating ≥ 4.0
- **Beneficio:** Badge, comisión 70%

**🥈 Elite:**
- 6 meses activo
- 20 clientes atendidos
- Rating ≥ 4.5
- **Beneficio:** Badge Elite, comisión 75%, soporte prioritario

**🥇 Master Trainer:**
- 1 año activo
- 50 clientes atendidos
- Rating ≥ 4.8
- **Beneficio:** Badge Master, comisión 80%, featured mensual

### Progreso

```
┌─────────────────────────────────────────┐
│  TU CERTIFICACIÓN                       │
├─────────────────────────────────────────┤
│  Nivel actual: 🥉 Verificado            │
│  Progreso a Elite:                      │
│                                         │
│  ✅ Tiempo activo: 8 meses (6 req)      │
│  ⏳ Clientes: 15/20                     │
│  ✅ Rating: 4.6 ≥ 4.5                   │
│                                         │
│  Te faltan 5 clientes para Elite! 💪   │
└─────────────────────────────────────────┘
```

## 🎯 Features Futuros (Roadmap)

### Fase 3: Monetización Avanzada
- [ ] Suscripciones recurrentes a clientes
- [ ] Bundles de rutinas (paquetes)
- [ ] Programa de afiliados
- [ ] Cupones de descuento

### Fase 4: Crecimiento
- [ ] API para integraciones externas
- [ ] Análisis con IA (sugerencias automáticas)
- [ ] Comunidad de entrenadores (foro)
- [ ] Certificaciones oficiales de la plataforma

---

**Ver también:**
- [Especificaciones Técnicas](technical.md)
- [Entrenados](../trainees/features.md)
- [Gimnasios](../gyms/features.md)
