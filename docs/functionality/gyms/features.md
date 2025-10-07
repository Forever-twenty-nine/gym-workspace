# 🏢 Gimnasios - Features

> Funcionalidades B2B para gestión de equipos de entrenadores

## 🔗 Modelo B2B

**Sistema de gestión multi-entrenador:**

El gimnasio opera como una **organización paraguas** que:

1. **Registra el gimnasio:** Crea cuenta empresarial
2. **Agrega entrenadores:** Invita a su equipo de entrenadores
3. **Gestiona clientes:** Vista consolidada de todos los clientes del equipo
4. **Reportes unificados:** Métricas y analytics del gimnasio completo
5. **Branding corporativo:** Logo y colores aplicados a todo el equipo

> **Importante:** Los entrenadores siguen trabajando de forma independiente con sus clientes, pero bajo el paraguas del gimnasio.

## 🆓 Plan Free

### ✅ Funcionalidades Incluidas

**Gestión de Equipo:**
- Registrar gimnasio (máximo 2 entrenadores)
- Invitar entrenadores por email
- Ver lista de entrenadores activos
- Ver métricas básicas por entrenador

**Dashboard Consolidado:**
- Total de entrenadores
- Total de clientes (todos los entrenadores)
- Total de rutinas creadas
- Actividad reciente del equipo

**Reportes Básicos:**
- Resumen mensual simple
- Lista de clientes por entrenador
- Conteo de entrenamientos totales

### ❌ Restricciones

- Máximo 2 entrenadores
- Sin branding personalizado
- Sin reportes avanzados
- Sin exportación de datos
- Sin integraciones API
- Sin soporte prioritario
- Sin gestión de planes (todos los entrenadores en free)

## 💼 Plan Business

### ✅ Todo lo de Free +

**Equipo Ilimitado:**
- Entrenadores ilimitados
- Organización jerárquica (administradores, trainers)
- Permisos y roles personalizados
- Gestión de accesos

**Branding Corporativo:**
- Logo del gimnasio en toda la plataforma
- Colores corporativos personalizados
- Dominio personalizado (ej: app.tugym.com)
- White-label completo
- Material exportado con branding del gym

**Analytics Avanzados:**
- Dashboard ejecutivo completo
- Métricas de rendimiento por entrenador
- Comparativas y rankings internos
- Tasa de retención de clientes
- Ingresos generados por entrenador
- Reportes automáticos semanales/mensuales

**Gestión de Planes:**
- Asignar plan Pro a entrenadores específicos
- Controlar acceso a features por entrenador
- Billing unificado del gimnasio
- Presupuesto centralizado

**Integraciones:**
- API REST para sistemas externos
- Webhooks para eventos
- Integración con CRM (Salesforce, HubSpot)
- Integración con sistemas de facturación
- Sincronización con software de gestión

**Soporte y Capacitación:**
- Soporte prioritario 24/7
- Onboarding personalizado
- Capacitación del equipo
- Account manager dedicado

**Reportes Profesionales:**
- Reportes PDF automáticos
- Dashboards personalizables
- Exportación CSV/Excel
- Análisis predictivo (IA)
- Benchmarks de industria

## 📊 Dashboard del Gimnasio

### Vista Principal (Admin)

```
┌─────────────────────────────────────────┐
│  🏢 GYM FITNESS CENTER                  │
│  📊 Plan: Business                      │
├─────────────────────────────────────────┤
│  RESUMEN DEL GIMNASIO                   │
│  👥 8 entrenadores activos              │
│  💪 94 clientes totales                 │
│  📋 156 rutinas creadas                 │
│  📈 87% adherencia promedio             │
│  💰 $3,450 ingresos marketplace         │
├─────────────────────────────────────────┤
│  📊 ESTE MES                            │
│  ↗️ +12 clientes nuevos                 │
│  📈 91% retención                       │
│  🏋️ 1,248 entrenamientos completados    │
│  ⭐ 4.7 rating promedio                 │
├─────────────────────────────────────────┤
│  ⚠️ ALERTAS                              │
│  • 3 entrenadores sin clientes nuevos   │
│  • 15 clientes inactivos (>7 días)     │
│  • 2 rutinas pendientes de revisión     │
├─────────────────────────────────────────┤
│  ACCIONES RÁPIDAS                       │
│  [➕ Invitar Entrenador] [📊 Reportes]  │
│  [⚙️ Configuración] [💬 Soporte]        │
└─────────────────────────────────────────┘
```

### Gestión de Entrenadores

**Lista de equipo:**
```
┌──────────────┬─────────┬─────────┬──────────┬────────┐
│ Entrenador   │ Plan    │ Clientes│ Rutinas  │ Rating │
├──────────────┼─────────┼─────────┼──────────┼────────┤
│ 👤 Juan P.   │ Pro ✨  │ 18      │ 24       │ ⭐ 4.9 │
│ Trainer      │         │ 🟢      │          │        │
├──────────────┼─────────┼─────────┼──────────┼────────┤
│ 👤 Ana L.    │ Pro ✨  │ 15      │ 18       │ ⭐ 4.8 │
│ Trainer      │         │ 🟢      │          │        │
├──────────────┼─────────┼─────────┼──────────┼────────┤
│ 👤 Carlos M. │ Free    │ 3       │ 5        │ ⭐ 4.6 │
│ Trainer      │         │ 🟢      │          │        │
├──────────────┼─────────┼─────────┼──────────┼────────┤
│ 👤 Laura R.  │ Free    │ 1       │ 2        │ ⭐ 5.0 │
│ Trainer      │         │ 🟡      │          │        │
└──────────────┴─────────┴─────────┴──────────┴────────┘

[Ver Detalles] [Cambiar Plan] [Configurar]
```

**Detalle de Entrenador:**
```
┌─────────────────────────────────────────┐
│  👤 JUAN PÉREZ                          │
│  📧 juan@gymfitness.com                 │
│  📅 Miembro desde: Enero 2024           │
│  📍 Plan: Pro ✨ (pagado por gimnasio)  │
│  🏆 Certificación: Elite                │
├─────────────────────────────────────────┤
│  MÉTRICAS (Últimos 30 días)            │
│  👥 18 clientes activos                 │
│  📊 89% adherencia promedio             │
│  🏋️ 234 entrenamientos completados      │
│  💰 $420 ingresos marketplace           │
│  ⭐ 4.9 rating (67 reviews)             │
├─────────────────────────────────────────┤
│  RENDIMIENTO                            │
│  📈 +3 clientes este mes                │
│  🔥 95% retención                       │
│  ⏱️ Tiempo respuesta: 2.3h promedio     │
│  📋 24 rutinas creadas                  │
├─────────────────────────────────────────┤
│  CONFIGURACIÓN                          │
│  Plan: [Pro ▼]                          │
│  Rol: [Trainer ▼]                       │
│  Permisos: [⚙️ Configurar]              │
│                                         │
│  [💬 Contactar] [📊 Ver Detalle]        │
│  [🔕 Desactivar] [🗑️ Eliminar]          │
└─────────────────────────────────────────┘
```

### Vista de Clientes Consolidada

**Todos los clientes del gimnasio:**
```
┌──────────────┬─────────────┬──────────┬──────────┐
│ Cliente      │ Entrenador  │ Plan     │ Estado   │
├──────────────┼─────────────┼──────────┼──────────┤
│ 👤 María G.  │ Juan P.     │ Premium  │ 🟢 Activo│
│ (hace 2h)    │             │ 89% adh. │          │
├──────────────┼─────────────┼──────────┼──────────┤
│ 👤 Pedro L.  │ Ana L.      │ Free     │ 🟢 Activo│
│ (ayer)       │             │ 75% adh. │          │
├──────────────┼─────────────┼──────────┼──────────┤
│ 👤 Sofia M.  │ Juan P.     │ Premium  │ 🔴 Alert │
│ (7 días)     │             │ 20% adh. │ Inactiva │
└──────────────┴─────────────┴──────────┴──────────┘

FILTROS:
[Todos ▼] [Por Entrenador ▼] [Por Plan ▼] [Por Estado ▼]
```

## 📊 Analytics Avanzados (Business)

### Dashboard Ejecutivo

```
┌─────────────────────────────────────────┐
│  📊 RESUMEN EJECUTIVO - MARZO 2025      │
├─────────────────────────────────────────┤
│  CRECIMIENTO                            │
│  👥 Clientes: 94 (+15 vs mes anterior)  │
│  📈 Crecimiento: +19%                   │
│                                         │
│  Gráfica de crecimiento:                │
│  [Gráfico de área - últimos 6 meses]   │
│                                         │
│  Ene  Feb  Mar  Abr  May  Jun          │
│   65   72   79   82   87   94          │
├─────────────────────────────────────────┤
│  RETENCIÓN                              │
│  🔄 Tasa de retención: 91%              │
│  ❌ Churn rate: 9%                      │
│  📉 Clientes perdidos: 8                │
│                                         │
│  Benchmark industria: 85% ✅            │
│  (Estás por encima del promedio)       │
├─────────────────────────────────────────┤
│  ADHERENCIA                             │
│  📊 Promedio gimnasio: 87%              │
│  🏆 Top trainer: Juan P. (89%)          │
│  ⚠️ Más bajo: Laura R. (68%)            │
│                                         │
│  Por plan:                              │
│  Premium: 93% ████████████░             │
│  Free:    76% ████████░░░░              │
├─────────────────────────────────────────┤
│  INGRESOS MARKETPLACE                   │
│  💰 Total mes: $3,450                   │
│  📈 vs mes anterior: +$480 (+16%)       │
│                                         │
│  Top seller: Juan P. ($1,200)           │
│  Top rutina: "Hipertrofia 5 días"      │
├─────────────────────────────────────────┤
│  ENTRENADORES                           │
│  👥 Activos: 8                          │
│  ⭐ Rating promedio: 4.7                │
│  📋 Rutinas creadas: 156                │
│                                         │
│  Por certificación:                     │
│  Master: 1 | Elite: 3 | Verified: 4    │
├─────────────────────────────────────────┤
│  [📥 Exportar Reporte] [📧 Programar]   │
└─────────────────────────────────────────┘
```

### Ranking de Entrenadores

```
┌─────────────────────────────────────────┐
│  🏆 RANKING DEL MES                     │
├─────────────────────────────────────────┤
│  1. 🥇 Juan Pérez                       │
│     👥 18 clientes | ⭐ 4.9 | 💰 $1,200 │
│     📊 89% adherencia                   │
│                                         │
│  2. 🥈 Ana López                        │
│     👥 15 clientes | ⭐ 4.8 | 💰 $890   │
│     📊 87% adherencia                   │
│                                         │
│  3. 🥉 Carlos Martín                    │
│     👥 12 clientes | ⭐ 4.7 | 💰 $650   │
│     📊 85% adherencia                   │
│                                         │
│  [Ver Ranking Completo]                 │
├─────────────────────────────────────────┤
│  CATEGORÍAS                             │
│  🏆 Más clientes: Juan P. (18)          │
│  ⭐ Mejor rating: Laura R. (5.0)        │
│  💰 Más ventas: Juan P. ($1,200)        │
│  📈 Mayor crecimiento: Ana L. (+8)      │
└─────────────────────────────────────────┘
```

### Reportes Automáticos

**Tipos de reportes:**

1. **Reporte Semanal (lunes 9am):**
   - Resumen de la semana anterior
   - Nuevos clientes
   - Clientes inactivos
   - Top performers

2. **Reporte Mensual (día 1 del mes):**
   - Resumen ejecutivo completo
   - Comparativa mes anterior
   - Proyecciones próximo mes
   - Recomendaciones de acción

3. **Reporte de Retención (trimestral):**
   - Análisis detallado de churn
   - Causas de pérdida de clientes
   - Estrategias de retención
   - Benchmarks de industria

**Formato de envío:**
- 📧 Email automático a admins
- 📱 Notificación push
- 📥 Disponible en plataforma (PDF)

## 🎨 Branding Corporativo (Business)

### Configuración de Marca

```
┌─────────────────────────────────────────┐
│  🎨 BRANDING DEL GIMNASIO               │
├─────────────────────────────────────────┤
│  LOGO                                   │
│  [📷 Subir Logo]                        │
│  ┌──────────┐                           │
│  │   🏢     │  Logo actual              │
│  │ GYM FIT  │  (500x500px)              │
│  └──────────┘                           │
├─────────────────────────────────────────┤
│  COLORES CORPORATIVOS                   │
│  Color primario:  [#FF5722] 🟠          │
│  Color secundario: [#2196F3] 🔵         │
│  Color acento:     [#4CAF50] 🟢         │
│                                         │
│  Preview:                               │
│  [Vista previa de la app con colores]  │
├─────────────────────────────────────────┤
│  DOMINIO PERSONALIZADO (White-label)    │
│  URL actual: app.gymfitness.com         │
│  [⚙️ Configurar DNS]                    │
│                                         │
│  Instrucciones:                         │
│  1. Agregar CNAME en tu DNS             │
│  2. Verificar dominio                   │
│  3. Activar SSL automático              │
├─────────────────────────────────────────┤
│  APLICACIÓN EN:                         │
│  ✅ Apps móviles (logo splash)          │
│  ✅ Emails de sistema                   │
│  ✅ Rutinas exportadas (PDF)            │
│  ✅ Reportes del gimnasio               │
│  ✅ Invitaciones de entrenadores        │
│                                         │
│  [💾 Guardar Cambios]                   │
└─────────────────────────────────────────┘
```

### Ejemplo de Aplicación

**Email con branding:**
```
┌─────────────────────────────────────────┐
│  [LOGO GYM FITNESS CENTER]              │
├─────────────────────────────────────────┤
│                                         │
│  ¡Hola María!                           │
│                                         │
│  Tu entrenador Juan te ha asignado     │
│  una nueva rutina:                      │
│                                         │
│  📋 Full Body 3x Semana                 │
│                                         │
│  [Ver Rutina →]                         │
│                                         │
│  ─────────────────────────────          │
│  GYM FITNESS CENTER                     │
│  app.gymfitness.com                     │
│                                         │
└─────────────────────────────────────────┘
```

## 🔗 Integraciones (Business)

### API REST

**Endpoints disponibles:**

```
GET    /api/gym/stats              # Métricas generales
GET    /api/gym/trainers           # Lista de entrenadores
GET    /api/gym/clients            # Lista de clientes
GET    /api/gym/trainer/:id/stats  # Métricas por entrenador
POST   /api/gym/webhooks           # Configurar webhooks
```

**Ejemplo de uso:**
```bash
curl -X GET https://api.gymapp.com/gym/stats \
  -H "Authorization: Bearer GYM_API_KEY" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "totalTrainers": 8,
  "totalClients": 94,
  "totalRoutines": 156,
  "averageAdherence": 0.87,
  "monthlyGrowth": 0.19,
  "retentionRate": 0.91
}
```

### Webhooks

**Eventos disponibles:**

- `trainer.added` - Nuevo entrenador agregado
- `trainer.removed` - Entrenador removido
- `client.added` - Nuevo cliente (cualquier entrenador)
- `client.inactive` - Cliente inactivo >7 días
- `routine.created` - Nueva rutina creada
- `milestone.reached` - Hito alcanzado (ej: 100 clientes)

**Configuración:**
```
┌─────────────────────────────────────────┐
│  🔗 WEBHOOKS                            │
├─────────────────────────────────────────┤
│  URL destino:                           │
│  [https://your-system.com/webhook]      │
│                                         │
│  Eventos suscritos:                     │
│  ☑️ trainer.added                       │
│  ☑️ client.added                        │
│  ☑️ client.inactive                     │
│  ☐ routine.created                      │
│  ☑️ milestone.reached                   │
│                                         │
│  Secret key: [••••••••••••••••]         │
│                                         │
│  [🧪 Probar Webhook] [💾 Guardar]       │
└─────────────────────────────────────────┘
```

### Integración CRM

**Salesforce / HubSpot:**

```
┌─────────────────────────────────────────┐
│  INTEGRACIÓN CRM                        │
├─────────────────────────────────────────┤
│  Sistema: [Salesforce ▼]                │
│                                         │
│  Estado: 🟢 Conectado                   │
│  Última sincronización: Hace 5 min      │
│                                         │
│  MAPEO DE DATOS:                        │
│  Cliente → Lead/Contact                 │
│  Entrenador → Usuario                   │
│  Gimnasio → Account                     │
│                                         │
│  SINCRONIZACIÓN:                        │
│  ☑️ Nuevos clientes → Leads             │
│  ☑️ Estado cliente → Lead Status        │
│  ☑️ Métricas → Custom Fields            │
│                                         │
│  [⚙️ Configurar] [🔄 Forzar Sync]       │
└─────────────────────────────────────────┘
```

## 👥 Roles y Permisos (Business)

### Jerarquía

```
┌─────────────────────────────────────────┐
│  ESTRUCTURA ORGANIZACIONAL              │
├─────────────────────────────────────────┤
│  👑 Owner (Super Admin)                 │
│  ├── 📊 Acceso total                    │
│  ├── 💳 Gestión de billing              │
│  ├── ⚙️ Configuración del gimnasio      │
│  └── 👥 Gestión de roles                │
│                                         │
│  🔧 Admin                               │
│  ├── 📊 Dashboard completo              │
│  ├── 👥 Gestión de entrenadores         │
│  ├── 📋 Reportes y analytics            │
│  └── ⚙️ Configuración limitada          │
│                                         │
│  👨‍🏫 Trainer Manager                     │
│  ├── 📊 Dashboard básico                │
│  ├── 👥 Ver entrenadores                │
│  └── 📋 Reportes básicos                │
│                                         │
│  💼 Trainer (staff del gimnasio)        │
│  ├── 👤 Su perfil y clientes            │
│  ├── 📋 Sus rutinas                     │
│  └── 💬 Chat con sus clientes           │
└─────────────────────────────────────────┘
```

### Gestión de Permisos

```
┌─────────────────────────────────────────┐
│  CONFIGURAR PERMISOS: ANA LÓPEZ         │
├─────────────────────────────────────────┤
│  Rol actual: [Admin ▼]                  │
│                                         │
│  PERMISOS:                              │
│  Dashboard                              │
│  ☑️ Ver métricas globales               │
│  ☑️ Ver métricas por entrenador         │
│  ☐ Ver datos financieros                │
│                                         │
│  Gestión de Entrenadores                │
│  ☑️ Ver lista de entrenadores           │
│  ☑️ Invitar entrenadores                │
│  ☐ Eliminar entrenadores                │
│  ☑️ Cambiar planes de entrenadores      │
│                                         │
│  Clientes                               │
│  ☑️ Ver todos los clientes              │
│  ☐ Acceder a datos personales           │
│  ☐ Contactar clientes directamente      │
│                                         │
│  Reportes                               │
│  ☑️ Generar reportes                    │
│  ☑️ Exportar datos                      │
│  ☐ Configurar reportes automáticos      │
│                                         │
│  Configuración                          │
│  ☑️ Branding                            │
│  ☐ Integraciones                        │
│  ☐ Billing                              │
│                                         │
│  [💾 Guardar Permisos]                  │
└─────────────────────────────────────────┘
```

## 💰 Gestión de Planes (Business)

### Asignación de Planes a Entrenadores

```
┌─────────────────────────────────────────┐
│  GESTIÓN DE PLANES DEL EQUIPO          │
├─────────────────────────────────────────┤
│  Presupuesto mensual: $240              │
│  Usado: $120 (4 trainers Pro)           │
│  Disponible: $120                       │
│                                         │
│  ENTRENADORES:                          │
│                                         │
│  👤 Juan Pérez      [Pro ▼]  $30/mes   │
│  👤 Ana López       [Pro ▼]  $30/mes   │
│  👤 Carlos Martín   [Pro ▼]  $30/mes   │
│  👤 Laura Rodríguez [Pro ▼]  $30/mes   │
│  👤 Pedro Gómez     [Free ▼] $0/mes    │
│  👤 María Sánchez   [Free ▼] $0/mes    │
│                                         │
│  [💾 Aplicar Cambios]                   │
│                                         │
│  💡 Tip: Asigna Pro a trainers con más  │
│     de 5 clientes para maximizar ROI    │
└─────────────────────────────────────────┘
```

### Billing Unificado

```
┌─────────────────────────────────────────┐
│  💳 FACTURACIÓN                         │
├─────────────────────────────────────────┤
│  Plan Gimnasio: Business                │
│  Costo base: $99/mes                    │
│                                         │
│  Add-ons:                               │
│  + 4 trainers Pro ($30 x 4): $120       │
│  + API access: $0 (incluido)            │
│  + White-label: $0 (incluido)           │
│                                         │
│  ─────────────────────────────          │
│  TOTAL MENSUAL: $219                    │
│                                         │
│  Método de pago: •••• 4242              │
│  Próximo cargo: 1 Abril 2025            │
│                                         │
│  [📥 Ver Facturas] [💳 Cambiar Método]  │
└─────────────────────────────────────────┘
```

## 📧 Invitación de Entrenadores

### Proceso de Invitación

```
┌─────────────────────────────────────────┐
│  ➕ INVITAR ENTRENADOR                  │
├─────────────────────────────────────────┤
│  Email: [________________]              │
│  Nombre: [________________]             │
│  Rol: [Trainer ▼]                       │
│  Plan asignado: [Free ▼]                │
│                                         │
│  Mensaje personalizado (opcional):      │
│  [____________________________]         │
│  [____________________________]         │
│                                         │
│  [📧 Enviar Invitación]                 │
└─────────────────────────────────────────┘
```

**Email de invitación:**
```
┌─────────────────────────────────────────┐
│  [LOGO GYM FITNESS CENTER]              │
├─────────────────────────────────────────┤
│  ¡Hola!                                 │
│                                         │
│  GYM FITNESS CENTER te invita a unirte  │
│  a su equipo de entrenadores.           │
│                                         │
│  Como miembro del equipo tendrás:       │
│  ✅ Cuenta Pro incluida                 │
│  ✅ Clientes ilimitados                 │
│  ✅ Branding del gimnasio               │
│  ✅ Soporte prioritario                 │
│                                         │
│  [Aceptar Invitación →]                 │
│                                         │
│  Esta invitación expira en 7 días.      │
│                                         │
│  ─────────────────────────────          │
│  GYM FITNESS CENTER                     │
│  contact@gymfitness.com                 │
└─────────────────────────────────────────┘
```

## 📈 Features Futuros (Roadmap)

### Fase 3: Expansión B2B
- [ ] Multi-sede (franquicias)
- [ ] Reportes por sede
- [ ] Comparativas entre sedes
- [ ] Gestión centralizada multi-sede

### Fase 4: Inteligencia de Negocio
- [ ] Predicción de churn con IA
- [ ] Recomendaciones automáticas
- [ ] Análisis de sentimiento (reviews)
- [ ] Benchmarking automático vs competencia

### Fase 5: Monetización Avanzada
- [ ] Marketplace exclusivo del gimnasio
- [ ] Programa de referidos corporativo
- [ ] Certificaciones propias del gym
- [ ] Eventos y challenges del gimnasio

---

**Ver también:**
- [Especificaciones Técnicas](technical.md)
- [Entrenadores](../trainers/features.md)
- [Entrenados](../trainees/features.md)
