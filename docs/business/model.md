# 💼 Modelo de Negocio - Gym App# 💼 Modelo de Negocio - Gym App# 💼 Modelo de Negocio - Gym App



> Resumen ejecutivo y especificación general del sistema



## 📱 Descripción> Resumen ejecutivo y especificación general del sistema> Plataforma freemium para gestión de entrenamiento personalizado



Plataforma que permite a entrenadores gestionar clientes, crear rutinas personalizadas y administrar su negocio. Los clientes acceden a rutinas, registran progreso y se comunican con sus entrenadores. Los gimnasios gestionan equipos de entrenadores de forma centralizada.



## 🔗 Modelo de Conexión## 📱 Descripción## 📱 Descripción



**Sistema basado en invitaciones:**



1. Entrenador invita cliente por email (token único)Plataforma que permite a entrenadores gestionar clientes, crear rutinas personalizadas y administrar su negocio. Los clientes acceden a rutinas, registran progreso y se comunican con sus entrenadores. Los gimnasios gestionan equipos de entrenadores de forma centralizada.Aplicación que permite a entrenadores gestionar clientes, crear rutinas personalizadas y administrar su negocio de entrenamiento. Los clientes (entrenados) acceden a sus rutinas, registran progreso y se comunican con sus entrenadores.

2. Cliente se registra usando link de invitación

3. Conexión directa establecida (relación N:M)

4. Cliente ve solo rutinas asignadas por su(s) entrenador(es)

## 🔗 Modelo de Conexión## 🔗 Modelo de Conexión

> **Arquitectura:** No hay perfiles públicos, búsquedas ni descubrimiento de usuarios. Sistema cerrado de invitaciones.



## 👥 Tipos de Usuarios

**Sistema basado en invitaciones:****Sistema de invitación directa:**

### 💪 Entrenados (B2C)

Usuarios finales que acceden a rutinas y registran progreso.



**Planes:**1. Entrenador invita cliente por email (token único)1. El entrenador invita a sus clientes por email

- **Free:** Rutinas asignadas, historial limitado (2), watermark, anuncios

- **Premium:** Historial completo, stats avanzadas, sin watermark, múltiples entrenadores2. Cliente se registra usando link de invitación2. El cliente se registra usando el link de invitación



**[Ver especificación técnica →](../functionality/trainees.md)**3. Conexión directa establecida (relación N:M)3. Se establece conexión directa y privada



### 👨‍🏫 Entrenadores (B2C)4. Cliente ve solo rutinas asignadas por su(s) entrenador(es)4. El cliente solo ve rutinas asignadas por su(s) entrenador(es)

Profesionales que gestionan clientes y crean contenido.



**Planes:**

- **Free:** 3 clientes, 5 rutinas, invitaciones por email> **Arquitectura:** No hay perfiles públicos, búsquedas ni descubrimiento de usuarios. Sistema cerrado de invitaciones.> **Nota importante:** No es una red social. No hay perfiles públicos, búsquedas de entrenadores ni descubrimiento de usuarios. Todas las conexiones son por invitación directa.

- **Pro:** Ilimitado, chat, marketplace, branding, analytics



**[Ver especificación técnica →](../functionality/trainers.md)**

## 👥 Tipos de Usuarios## 👥 Tipos de Usuarios

### 🏢 Gimnasios (B2B)

Instituciones que gestionan equipos de entrenadores.



**Planes:**### 💪 Entrenados (B2C)### 💪 [Entrenados](trainees.md)

- **Free:** 3 entrenadores vinculados, gestión básica

- **Business:** Dashboard centralizado, branding institucional, reportes, CRMUsuarios finales que acceden a rutinas y registran progreso.Usuarios finales que acceden a rutinas y siguen su progreso.



**[Ver especificación técnica →](../functionality/gyms.md)**



## 🎯 Features Principales**Planes:**- **Free:** Rutinas básicas asignadas por su entrenador, marca de agua, historial limitado



### Sistema de Invitaciones- **Free:** Rutinas asignadas, historial limitado (2), watermark, anuncios- **Premium:** Estadísticas avanzadas, sin marcas de agua, historial completo, múltiples entrenadores

- Generación de tokens únicos por email

- Links de registro con auto-vinculación- **Premium:** Historial completo, stats avanzadas, sin watermark, múltiples entrenadores

- Tracking de invitaciones (pendiente/aceptada)

- Re-envío de invitaciones**[Ver funcionalidades completas →](trainees.md)**



### Gestión de Rutinas**[Ver especificación técnica →](trainees.md)**

- Editor WYSIWYG de rutinas

- Biblioteca de ejercicios predefinidos### �‍🏫 [Entrenadores](trainers.md)

- Asignación de rutinas a clientes

- Tracking de completitud### 👨‍🏫 Entrenadores (B2C)Profesionales que crean contenido y gestionan clientes.



### Sistema FreemiumProfesionales que gestionan clientes y crean contenido.

- Middleware de validación de planes

- Límites configurables por plan- **Free:** Hasta 5 rutinas, 3 clientes, invitaciones por email

- Stripe/PayPal para suscripciones

- Webhooks para sync de estado**Planes:**- **Pro:** Clientes ilimitados, marketplace, branding, analytics, chat



### Analytics y Reporting- **Free:** 3 clientes, 5 rutinas, invitaciones por email

- Dashboard por tipo de usuario

- Métricas en tiempo real- **Pro:** Ilimitado, chat, marketplace, branding, analytics**[Ver funcionalidades completas →](trainers.md)**

- Exportación PDF/Excel (Premium)

- Gráficas de progreso



### Chat en Tiempo Real (Pro)**[Ver especificación técnica →](trainers.md)**### 🏢 [Gimnasios](gyms.md)

- WebSocket (Socket.io)

- Estado online/offlineInstituciones que digitalizan y optimizan operaciones (B2B).

- Notificaciones push

- Historial persistente### 🏢 Gimnasios (B2B)



### Marketplace de Rutinas (Pro)Instituciones que gestionan equipos de entrenadores.- **Free:** Perfil institucional, 3 entrenadores vinculados

- Publicación de rutinas para venta

- Sistema de comisiones (70/30)- **Business:** Dashboard centralizado, branding institucional, reportes, CRM

- Reviews y ratings

- Dashboard de ingresos**Planes:**



## 📊 Métricas Clave del Sistema- **Free:** 3 entrenadores vinculados, gestión básica**[Ver funcionalidades completas →](gyms.md)**



### KPIs de Producto- **Business:** Dashboard centralizado, branding institucional, reportes, CRM



**Crecimiento:**> 💰 **Precios, comisiones y proyecciones:** Ver [Pricing y Monetización](pricing.md)

- Usuarios registrados por tipo

- Tasa de activación (completan onboarding)**[Ver especificación técnica →](gyms.md)**## 📚 Documentación

- Tasa de crecimiento MoM



**Engagement:**

- DAU/MAU por tipo de usuario## 🎯 Features Principales### Por Tipo de Usuario

- Rutinas completadas/día

- Invitaciones enviadas/aceptadas

- Tasa de adherencia (workouts vs asignados)

### Sistema de Invitaciones| Segmento | Funcionalidades | Precios y ROI |

**Conversión:**

- Free → Premium por segmento- Generación de tokens únicos por email|----------|----------------|---------------|

- Tiempo promedio hasta upgrade

- Churn rate mensual/anual- Links de registro con auto-vinculación| 💪 Entrenados | [Ver funcionalidades →](trainees.md) | [Ver pricing →](pricing.md#-entrenados) |



> 💰 **Métricas financieras:** Ver [Pricing](pricing.md)- Tracking de invitaciones (pendiente/aceptada)| 👨‍🏫 Entrenadores | [Ver funcionalidades →](trainers.md) | [Ver pricing →](pricing.md#-entrenadores) |



## 🚀 Roadmap General- Re-envío de invitaciones| 🏢 Gimnasios | [Ver funcionalidades →](gyms.md) | [Ver pricing →](pricing.md#-gimnasios) |



### Fase 1: MVP ✅

- ✅ Autenticación y perfiles

- ✅ Sistema de invitaciones### Gestión de Rutinas### Otros Recursos

- ✅ CRUD de rutinas

- ✅ Asignación trainer → trainee- Editor WYSIWYG de rutinas

- 🚧 Dashboard básico

- Biblioteca de ejercicios predefinidos- 💰 **[Pricing y Monetización](pricing.md)** - Precios, comisiones, proyecciones

### Fase 2: Freemium (Q1 2025) 🚧

- [ ] Integración Stripe/PayPal- Asignación de rutinas a clientes- 🏗️ **[Arquitectura](../architecture/overview.md)** - Estructura técnica del sistema

- [ ] Middleware de planes y límites

- [ ] Watermark dinámico- Tracking de completitud- 🚀 **[Setup](../getting-started/setup.md)** - Configuración inicial

- [ ] Sistema de ads (AdMob)

- 💻 **[Desarrollo](../guides/development.md)** - Guía para desarrolladores

### Fase 3: Features Pro (Q2-Q3 2025) 📋

- [ ] Chat en tiempo real### Sistema Freemium

- [ ] Marketplace de rutinas

- [ ] Sistema de comisiones- Middleware de validación de planes---

- [ ] Branding personalizado

- [ ] Analytics avanzados- Límites configur ables por plan



### Fase 4: B2B (Q4 2025) 📋- Stripe/PayPal para suscripciones**Última actualización:** Enero 2025 · **Versión:** 2.2que conecta tres tipos de usuarios en un ecosistema unificado. Cada segmento genera y recibe valor mediante un modelo freemium escalable con múltiples fuentes de ingreso.

- [ ] Plan Business para gimnasios

- [ ] Dashboard multi-entrenador- Webhooks para sync de estado

- [ ] Reportes consolidados

- [ ] White label## 👥 Tipos de Usuarios



### Fase 5: Expansión (2026+) 📋### Analytics y Reporting

- [ ] API pública para integraciones

- [ ] Wearables (Apple Watch, Garmin)- Dashboard por tipo de usuario### 💪 [Entrenados](trainees.md)

- [ ] Recomendaciones IA

- [ ] Programas corporativos- Métricas en tiempo realUsuarios finales que acceden a rutinas y siguen su progreso.



## 🛠️ Stack Tecnológico Sugerido- Exportación PDF/Excel (Premium)



### Backend- Gráficas de progreso- **Free:** Rutinas públicas, marca de agua, historial limitado

```

- Node.js + Express / NestJS- **Premium:** Personalización, stats avanzadas, sin anuncios

- PostgreSQL (datos relacionales)

- Redis (cache, sessions)### Chat en Tiempo Real (Pro)

- Socket.io (chat real-time)

- Stripe SDK (pagos)- WebSocket (Socket.io)**[Ver funcionalidades completas →](trainees.md)**

- Firebase Admin (notificaciones push)

```- Estado online/offline



### Frontend Web- Notificaciones push### 👨‍🏫 [Entrenadores](trainers.md)

```

- React / Angular (según preferencia)- Historial persistenteProfesionales que crean contenido y gestionan clientes.

- TypeScript

- TailwindCSS / Material UI

- Chart.js / Recharts (gráficas)

- Socket.io-client### Marketplace de Rutinas (Pro)- **Free:** Perfil básico, 5 rutinas, 3 clientes

```

- Publicación de rutinas para venta- **Pro:** Ilimitado, marketplace, branding, analytics

### Mobile

```- Sistema de comisiones (70/30)

- React Native / Flutter

- Expo (si React Native)- Reviews y ratings**[Ver funcionalidades completas →](trainers.md)**

- Firebase SDK (auth, push)

```- Dashboard de ingresos



### Infraestructura### 🏢 [Gimnasios](gyms.md)

```

- Docker + Kubernetes## 📊 Métricas Clave del SistemaInstituciones que digitalizan y optimizan operaciones (B2B).

- AWS / GCP / Azure

- CI/CD: GitHub Actions

- Monitoring: Sentry, DataDog

```### KPIs de Producto- **Free:** Perfil institucional, 3 entrenadores



## 🗄️ Arquitectura de Datos- **Business:** Dashboard centralizado, branding, reportes, CRM



### Entidades Principales**Crecimiento:**



```- Usuarios registrados por tipo**[Ver funcionalidades completas →](gyms.md)**

users (base)

├─ trainees- Tasa de activación (completan onboarding)

├─ trainers

└─ gym_admins- Tasa de crecimiento MoM> 💰 **Precios, comisiones y proyecciones:** Ver [Pricing y Monetización](pricing.md)



routines

├─ exercises (embedded)

└─ assignments (pivot: trainer → trainee)**Engagement:**## 🎯 Estrategia



workouts (logs)- DAU/MAU por tipo de usuario

├─ workout_exercises

└─ personal_records- Rutinas completadas/día### Modelo de Crecimiento



invitations- Invitaciones enviadas/aceptadas

├─ status: pending, accepted, expired

└─ token: UUID- Tasa de adherencia (workouts vs asignados)**Invitación directa:**



subscriptions- Entrenadores invitan a sus clientes existentes

├─ provider: stripe, paypal

├─ plan: free, premium, pro, business**Conversión:**- Cada cliente puede ser invitado por múltiples entrenadores

└─ status: active, cancelled, past_due

- Free → Premium por segmento- Crecimiento orgánico basado en relaciones reales

marketplace_sales

├─ routine_id- Tiempo promedio hasta upgrade

├─ buyer_id

├─ seller_id (trainer)- Churn rate mensual/anual**Marketing viral integrado:**

└─ commission_split

```- **Versión Free:** Marca de agua en compartidos de clientes → publicidad orgánica gratuita



### Relaciones Clave> 💰 **Métricas financieras:** Ver [Pricing](pricing.md)- **Versión Premium:** Sin marca de agua → diferenciación y profesionalismo para clientes activos en RRSS



```- **Red de efectos:** Más clientes activos → Más entrenadores → Más valor para gimnasios

trainer (N) <----> (M) trainee  [invitations]

trainer (1) <----> (N) routine## 🚀 Roadmap General

trainee (1) <----> (N) workout_log

routine (1) <----> (N) assignment### Triggers de Conversión

gym (1) <----> (N) trainer [team]

```### Fase 1: MVP ✅



## 🔒 Consideraciones de Seguridad- ✅ Autenticación y perfiles**Entrenados → Premium:**



- Autenticación JWT + refresh tokens- ✅ Sistema de invitaciones- Historial limitado (pierden acceso a rutinas antiguas)

- Roles y permisos (RBAC)

- Rate limiting en APIs- ✅ CRUD de rutinas- Entrenador ofrece plan personalizado avanzado

- Validación de planes en middleware

- Encriptación de datos sensibles- ✅ Asignación trainer → trainee- Usuarios activos en RRSS buscan imagen profesional sin marca de agua

- GDPR compliance (exportación/eliminación de datos)

- 🚧 Dashboard básico- Experiencia sin anuncios

---

- Quieren trabajar con múltiples entrenadores especializados

**Documentación Técnica:**

- [Entrenados](../functionality/trainees.md)### Fase 2: Freemium (Q1 2025) 🚧

- [Entrenadores](../functionality/trainers.md)

- [Gimnasios](../functionality/gyms.md)- [ ] Integración Stripe/PayPal**Entrenadores → Pro:**

- [Pricing y Monetización](pricing.md)

- [Arquitectura](../architecture/overview.md)- [ ] Middleware de planes y límites- Superan límite de 3 clientes


- [ ] Watermark dinámico- Quieren monetizar mediante marketplace

- [ ] Sistema de ads (AdMob)- Necesitan branding personalizado en rutinas

- Requieren herramientas avanzadas de seguimiento

### Fase 3: Features Pro (Q2-Q3 2025) 📋- Necesitan chat ilimitado con clientes

- [ ] Chat en tiempo real

- [ ] Marketplace de rutinas**Gimnasios → Business:**

- [ ] Sistema de comisiones- Más de 3 entrenadores en el equipo

- [ ] Branding personalizado- Necesitan reportes consolidados del equipo completo

- [ ] Analytics avanzados- Quieren branding institucional en todos los materiales

- Buscan optimizar operaciones y centralizar gestión

### Fase 4: B2B (Q4 2025) 📋- Requieren análisis de retención y performance

- [ ] Plan Business para gimnasios

- [ ] Dashboard multi-entrenador### Ventajas Competitivas

- [ ] Reportes consolidados

- [ ] White label1. **Marketing viral integrado:** Cada compartición gratuita promociona la app

2. **Modelo multi-sided:** Red de efectos entre 3 segmentos interdependientes

### Fase 5: Expansión (2026+) 📋3. **Monetización en capas:** Suscripciones + comisiones + B2B

- [ ] API pública para integraciones4. **Branding como servicio:** Diferenciación incluida en planes premium

- [ ] Wearables (Apple Watch, Garmin)5. **Datos e insights:** Analytics para decisiones informadas

- [ ] Recomendaciones IA6. **Modelo privado:** Enfoque en relaciones reales entrenador-cliente (no red social)

- [ ] Programas corporativos

## 📊 Métricas Clave

## 🛠️ Stack Tecnológico Sugerido

### KPIs de Crecimiento

### Backend- Usuarios registrados por tipo

```- DAU/MAU (Daily/Monthly Active Users)

- Node.js + Express / NestJS- Tasa de crecimiento MoM (Month over Month)

- PostgreSQL (datos relacionales)- Tasa de activación (completan onboarding)

- Redis (cache, sessions)

- Socket.io (chat real-time)### KPIs de Engagement

- Stripe SDK (pagos)- Rutinas completadas por usuario/mes

- Firebase Admin (notificaciones push)- Sesiones por usuario/semana

```- Tiempo promedio en app

- Invitaciones enviadas por entrenador

### Frontend Web- Tasa de aceptación de invitaciones

```- Tasa de adherencia a rutinas

- React / Angular (según preferencia)

- TypeScript### KPIs de Conversión

- TailwindCSS / Material UI- Tasa Free → Premium por segmento

- Chart.js / Recharts (gráficas)- Tiempo promedio hasta upgrade

- Socket.io-client- Churn rate mensual/anual

```- Reactivación de usuarios inactivos



### Mobile> 💰 **KPIs financieros (MRR, ARR, LTV, CAC, ARPU):** Ver [Pricing](pricing.md#-kpis-financieros)

```

- React Native / FlutterVer métricas detalladas: [Entrenados](trainees.md#-métricas-y-seguimiento) | [Entrenadores](trainers.md#-métricas-y-analytics) | [Gimnasios](gyms.md#-métricas-y-dashboard)

- Expo (si React Native)

- Firebase SDK (auth, push)

```## 🎯 Roadmap



### Infraestructura### Fase 1: MVP ✅

```- ✅ Versión free funcional

- Docker + Kubernetes- ✅ Sistema de autenticación

- AWS / GCP / Azure- ✅ Gestión básica de rutinas

- CI/CD: GitHub Actions- 🚧 Dashboard entrenadores

- Monitoring: Sentry, DataDog

```### Fase 2: Freemium (Q1 2025) 🚧

- [ ] Sistema de suscripciones

## 🗄️ Arquitectura de Datos- [ ] Planes diferenciados

- [ ] Pasarela de pagos

### Entidades Principales- [ ] Marca de agua



```### Fase 3: Marketplace (Q2-Q3 2025) 📋

users (base)- [ ] Venta de rutinas (70/30)

├─ trainees- [ ] Programa de afiliados

├─ trainers- [ ] Reviews y ratings

└─ gym_admins- [ ] Certificaciones



routines### Fase 4: B2B & Enterprise (Q4 2025) 📋

├─ exercises (embedded)- [ ] Plan Business gimnasios

└─ assignments (pivot: trainer → trainee)- [ ] Dashboard multi-entrenador

- [ ] White label

workouts (logs)- [ ] API integraciones

├─ workout_exercises

└─ personal_records### Fase 5: Expansión (2026+) 📋

- [ ] Internacionalización

invitations- [ ] Wearables (Apple Watch, Garmin)

├─ status: pending, accepted, expired- [ ] IA para recomendaciones

└─ token: UUID- [ ] Programas corporativos



subscriptions## � Documentación

├─ provider: stripe, paypal

├─ plan: free, premium, pro, business| Segmento | Link |

└─ status: active, cancelled, past_due|----------|------|

| 💪 Entrenados | [Ver detalles →](trainees.md) |

marketplace_sales| 👨‍🏫 Entrenadores | [Ver detalles →](trainers.md) |

├─ routine_id| 🏢 Gimnasios | [Ver detalles →](gyms.md) |

├─ buyer_id

├─ seller_id (trainer)**Otros recursos:**

└─ commission_split- [Arquitectura](../architecture/overview.md)

```- [Setup](../getting-started/setup.md)

- [Desarrollo](../guides/development.md)

### Relaciones Clave

---

```

trainer (N) <----> (M) trainee  [invitations]**Última actualización:** Octubre 2025 · **Versión:** 2.0

trainer (1) <----> (N) routine
trainee (1) <----> (N) workout_log
routine (1) <----> (N) assignment
gym (1) <----> (N) trainer [team]
```

## 🔒 Consideraciones de Seguridad

- Autenticación JWT + refresh tokens
- Roles y permisos (RBAC)
- Rate limiting en APIs
- Validación de planes en middleware
- Encriptación de datos sensibles
- GDPR compliance (exportación/eliminación de datos)

---

**Documentación Técnica:**
- [Entrenados](trainees.md) | [Entrenadores](trainers.md) | [Gimnasios](gyms.md)
- [Pricing y Monetización](pricing.md)
- [Arquitectura](../architecture/overview.md)
