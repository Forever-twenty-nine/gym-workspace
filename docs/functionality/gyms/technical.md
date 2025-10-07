# 🏢 Gimnasios - Especificaciones Técnicas

> Data models, APIs, multi-tenancy, y arquitectura B2B

## 📦 Data Models (TypeScript)

### Entidad Gym

```typescript
interface Gym {
  id: string;                    // UUID
  name: string;
  email: string;                 // unique
  phone?: string;
  address?: string;
  
  // Plan
  plan: 'free' | 'business';
  planStartDate: Date;
  planExpiryDate?: Date;
  
  // Branding (Business only)
  logoUrl?: string;
  primaryColor?: string;         // Hex
  secondaryColor?: string;
  accentColor?: string;
  customDomain?: string;         // app.gymname.com
  domainVerified: boolean;
  
  // Billing
  stripeCustomerId?: string;
  billingEmail?: string;
  
  // Limits
  maxTrainers: number;           // 2 para free, unlimited para business
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  trainers: GymTrainer[];        // N:M through GymTrainer
  admins: GymAdmin[];            // 1:N
  apiKeys: ApiKey[];             // 1:N (Business only)
  webhooks: Webhook[];           // 1:N (Business only)
}
```

### Relación Gym-Trainer

```typescript
interface GymTrainer {
  id: string;
  gymId: string;
  trainerId: string;
  
  // Role dentro del gym
  role: 'owner' | 'admin' | 'trainer_manager' | 'trainer';
  
  // Plan asignado por el gym
  assignedPlan: 'free' | 'pro';  // Gym paga por Pro si aplica
  planPaidByGym: boolean;
  
  // Status
  status: 'active' | 'inactive' | 'pending';
  invitedAt: Date;
  joinedAt?: Date;
  
  // Permissions (custom por rol)
  permissions: {
    viewAllClients: boolean;
    viewFinancials: boolean;
    manageTrainers: boolean;
    manageBilling: boolean;
    configureIntegrations: boolean;
    viewReports: boolean;
    exportData: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  gym: Gym;
  trainer: Trainer;
}
```

### Invitación de Gym a Trainer

```typescript
interface GymTrainerInvitation {
  id: string;
  gymId: string;
  email: string;
  token: string;                 // Unique
  
  assignedRole: 'admin' | 'trainer_manager' | 'trainer';
  assignedPlan: 'free' | 'pro';
  
  status: 'pending' | 'accepted' | 'expired';
  customMessage?: string;
  
  createdAt: Date;
  expiresAt: Date;               // 7 días
  acceptedAt?: Date;
  
  // Relations
  gym: Gym;
}
```

### API Keys (Business)

```typescript
interface ApiKey {
  id: string;
  gymId: string;
  name: string;                  // "Production", "Development"
  
  key: string;                   // Hashed
  prefix: string;                // Primeros 8 chars (visible)
  
  scopes: string[];              // ['read:stats', 'read:trainers', 'write:webhooks']
  
  status: 'active' | 'revoked';
  lastUsedAt?: Date;
  expiresAt?: Date;              // Opcional
  
  createdAt: Date;
  createdBy: string;             // Admin user ID
  
  // Relations
  gym: Gym;
}
```

### Webhooks (Business)

```typescript
interface Webhook {
  id: string;
  gymId: string;
  
  url: string;                   // HTTPS required
  secret: string;                // Para firmar payloads
  
  events: WebhookEvent[];        // ['trainer.added', 'client.added', ...]
  
  status: 'active' | 'paused' | 'failed';
  failureCount: number;          // Auto-pause después de 5
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  gym: Gym;
  deliveries: WebhookDelivery[]; // Log de entregas
}

type WebhookEvent = 
  | 'trainer.added'
  | 'trainer.removed'
  | 'client.added'
  | 'client.inactive'
  | 'routine.created'
  | 'milestone.reached';

interface WebhookDelivery {
  id: string;
  webhookId: string;
  
  event: WebhookEvent;
  payload: Record<string, any>;
  
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  responseBody?: string;
  
  attempts: number;
  nextRetryAt?: Date;
  
  createdAt: Date;
  deliveredAt?: Date;
}
```

### Reportes Automáticos

```typescript
interface ScheduledReport {
  id: string;
  gymId: string;
  
  name: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  frequency: string;             // Cron expression
  
  recipients: string[];          // Email addresses
  format: 'pdf' | 'csv' | 'excel';
  
  metrics: string[];             // ['adherence', 'retention', 'growth', ...]
  
  lastSentAt?: Date;
  nextSendAt: Date;
  
  status: 'active' | 'paused';
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  gym: Gym;
  deliveries: ReportDelivery[];
}

interface ReportDelivery {
  id: string;
  reportId: string;
  
  fileUrl: string;               // S3 URL
  sentAt: Date;
  recipients: string[];
  
  status: 'sent' | 'failed';
  error?: string;
}
```

## 🗄️ Database Schema (SQL)

### Tabla `gyms`

```sql
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'business')),
  plan_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  plan_expiry_date TIMESTAMP,
  
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  custom_domain VARCHAR(255) UNIQUE,
  domain_verified BOOLEAN DEFAULT FALSE,
  
  stripe_customer_id VARCHAR(255),
  billing_email VARCHAR(255),
  
  max_trainers INTEGER DEFAULT 2,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_plan_limits CHECK (
    (plan = 'free' AND max_trainers = 2) OR
    (plan = 'business' AND max_trainers >= 2)
  )
);

CREATE INDEX idx_gyms_email ON gyms(email);
CREATE INDEX idx_gyms_custom_domain ON gyms(custom_domain) WHERE custom_domain IS NOT NULL;
```

### Tabla `gym_trainers` (Join table)

```sql
CREATE TABLE gym_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'trainer_manager', 'trainer')),
  
  assigned_plan VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (assigned_plan IN ('free', 'pro')),
  plan_paid_by_gym BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMP,
  
  -- Permissions JSONB
  permissions JSONB NOT NULL DEFAULT '{
    "viewAllClients": false,
    "viewFinancials": false,
    "manageTrainers": false,
    "manageBilling": false,
    "configureIntegrations": false,
    "viewReports": true,
    "exportData": false
  }'::jsonb,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(gym_id, trainer_id)
);

CREATE INDEX idx_gym_trainers_gym ON gym_trainers(gym_id);
CREATE INDEX idx_gym_trainers_trainer ON gym_trainers(trainer_id);
CREATE INDEX idx_gym_trainers_status ON gym_trainers(gym_id, status);
```

### Tabla `gym_trainer_invitations`

```sql
CREATE TABLE gym_trainer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  
  assigned_role VARCHAR(20) NOT NULL CHECK (assigned_role IN ('admin', 'trainer_manager', 'trainer')),
  assigned_plan VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (assigned_plan IN ('free', 'pro')),
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  custom_message TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_gym_invitations_token ON gym_trainer_invitations(token);
CREATE INDEX idx_gym_invitations_gym ON gym_trainer_invitations(gym_id);
CREATE INDEX idx_gym_invitations_status ON gym_trainer_invitations(status);
```

### Tabla `api_keys` (Business)

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  
  key VARCHAR(255) NOT NULL UNIQUE,  -- bcrypt hash
  prefix VARCHAR(12) NOT NULL,        -- Visible prefix
  
  scopes TEXT[] NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,           -- Admin user
  
  CONSTRAINT business_only CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE id = gym_id AND plan = 'business')
  )
);

CREATE INDEX idx_api_keys_gym ON api_keys(gym_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX idx_api_keys_status ON api_keys(status) WHERE status = 'active';
```

### Tabla `webhooks` (Business)

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,
  
  events TEXT[] NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  failure_count INTEGER DEFAULT 0,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT https_only CHECK (url LIKE 'https://%'),
  CONSTRAINT business_only CHECK (
    EXISTS (SELECT 1 FROM gyms WHERE id = gym_id AND plan = 'business')
  )
);

CREATE INDEX idx_webhooks_gym ON webhooks(gym_id);
CREATE INDEX idx_webhooks_status ON webhooks(status) WHERE status = 'active';
```

### Tabla `webhook_deliveries`

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  status_code INTEGER,
  response_body TEXT,
  
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);
```

### Tabla `scheduled_reports`

```sql
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('weekly', 'monthly', 'quarterly')),
  frequency VARCHAR(100) NOT NULL,    -- Cron expression
  
  recipients TEXT[] NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'csv', 'excel')),
  
  metrics TEXT[] NOT NULL,
  
  last_sent_at TIMESTAMP,
  next_send_at TIMESTAMP NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_gym ON scheduled_reports(gym_id);
CREATE INDEX idx_scheduled_reports_next ON scheduled_reports(next_send_at) WHERE status = 'active';
```

## 🔐 Autenticación Multi-Tenant

### JWT Payload (Gym Admin)

```typescript
interface GymAdminJWTPayload {
  sub: string;                   // admin.id
  email: string;
  role: 'gym_admin';
  gymId: string;
  gymPlan: 'free' | 'business';
  permissions: {
    viewAllClients: boolean;
    viewFinancials: boolean;
    manageTrainers: boolean;
    manageBilling: boolean;
    configureIntegrations: boolean;
    viewReports: boolean;
    exportData: boolean;
  };
  
  iat: number;
  exp: number;
}
```

### JWT Payload (Trainer en Gym)

```typescript
interface TrainerInGymJWTPayload {
  sub: string;                   // trainer.id
  email: string;
  role: 'trainer';
  gymId?: string;                // Present si es parte de un gym
  gymRole?: 'trainer' | 'trainer_manager' | 'admin';
  plan: 'free' | 'pro';          // Puede ser pagado por gym
  planPaidByGym: boolean;
  
  iat: number;
  exp: number;
}
```

### Middleware: Tenant Isolation

```typescript
// Asegura que los queries solo accedan a datos del gym correcto
function tenantIsolation(req: Request, res: Response, next: NextFunction) {
  const { gymId } = req.user as GymAdminJWTPayload;
  
  // Inyectar gymId en todos los queries
  req.tenantId = gymId;
  
  next();
}

// Query helper
async function findTrainers(gymId: string) {
  return db.trainers.findMany({
    where: {
      gymTrainers: {
        some: {
          gymId,
          status: 'active',
        },
      },
    },
  });
}
```

## 🌐 API Endpoints

### Gestión del Gimnasio

```typescript
// GET /api/gym/dashboard
// Dashboard principal del gym
interface GetGymDashboardResponse {
  gym: {
    id: string;
    name: string;
    plan: string;
  };
  summary: {
    totalTrainers: number;
    activeTrainers: number;
    totalClients: number;
    totalRoutines: number;
    averageAdherence: number;
    monthlyGrowth: number;
    retentionRate: number;
  };
  alerts: Array<{
    type: 'trainer_inactive' | 'client_inactive' | 'routine_pending';
    message: string;
    count: number;
  }>;
}

// GET /api/gym/trainers
// Lista de entrenadores del gym
interface GetGymTrainersResponse {
  trainers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assignedPlan: 'free' | 'pro';
    status: 'active' | 'inactive';
    
    metrics: {
      clientCount: number;
      routineCount: number;
      rating: number;
      totalSales: number;
    };
    
    joinedAt: Date;
  }>;
  totalCount: number;
  activeCount: number;
}

// GET /api/gym/trainers/:id/stats
// Detalle de un entrenador
interface GetTrainerStatsResponse {
  trainer: {
    id: string;
    name: string;
    email: string;
    plan: string;
    role: string;
  };
  metrics: {
    clients: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    routines: {
      total: number;
      active: number;
      draft: number;
    };
    adherence: {
      average: number;
      byClient: Array<{
        clientId: string;
        clientName: string;
        adherence: number;
      }>;
    };
    marketplace: {
      totalSales: number;
      earnings: number;
      topRoutine: {
        id: string;
        title: string;
        salesCount: number;
      };
    };
    performance: {
      rating: number;
      totalRatings: number;
      responseTime: number;  // horas promedio
      retentionRate: number;
    };
  };
}
```

### Gestión de Entrenadores

```typescript
// POST /api/gym/trainers/invite
// Invitar entrenador al gym
interface InviteTrainerRequest {
  email: string;
  name?: string;
  role: 'admin' | 'trainer_manager' | 'trainer';
  assignedPlan: 'free' | 'pro';
  customMessage?: string;
}

// Middleware: Check límite de entrenadores
async function checkTrainerLimit(gymId: string, gymPlan: string) {
  const gym = await db.gyms.findById(gymId);
  
  if (gymPlan === 'business') return true;  // Unlimited
  
  const activeCount = await db.gymTrainers.count({
    where: { gymId, status: 'active' },
  });
  
  if (activeCount >= gym.maxTrainers) {
    throw new ForbiddenError('Free plan limited to 2 trainers');
  }
  
  return true;
}

// PATCH /api/gym/trainers/:id
// Actualizar trainer (plan, rol, permisos)
interface UpdateTrainerRequest {
  assignedPlan?: 'free' | 'pro';
  role?: 'admin' | 'trainer_manager' | 'trainer';
  permissions?: Partial<TrainerPermissions>;
  status?: 'active' | 'inactive';
}

// DELETE /api/gym/trainers/:id
// Remover trainer del gym (no elimina cuenta)
// Response: 204 No Content
```

### Clientes Consolidados

```typescript
// GET /api/gym/clients
// Todos los clientes del gym (de todos los trainers)
interface GetGymClientsRequest {
  trainerId?: string;            // Filtrar por trainer
  status?: 'active' | 'inactive';
  plan?: 'free' | 'premium';
  page: number;
  limit: number;
}

interface GetGymClientsResponse {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    
    trainer: {
      id: string;
      name: string;
    };
    
    currentRoutine?: {
      title: string;
      progress: number;
    };
    
    metrics: {
      adherence: number;
      lastWorkout?: Date;
      daysInactive: number;
    };
    
    status: 'active' | 'inactive';
  }>;
  
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Reportes

```typescript
// GET /api/gym/reports/summary
// Reporte resumen
interface GetReportSummaryRequest {
  startDate: string;             // ISO 8601
  endDate: string;
  format?: 'json' | 'pdf' | 'csv';
}

interface GetReportSummaryResponse {
  period: {
    start: Date;
    end: Date;
  };
  
  trainers: {
    total: number;
    active: number;
    new: number;
    averageRating: number;
  };
  
  clients: {
    total: number;
    new: number;
    churned: number;
    retentionRate: number;
  };
  
  workouts: {
    total: number;
    averagePerClient: number;
    averageAdherence: number;
  };
  
  marketplace: {
    totalSales: number;
    totalEarnings: number;
    topSellers: Array<{
      trainerId: string;
      trainerName: string;
      sales: number;
    }>;
  };
  
  growth: {
    clientGrowthRate: number;
    trainerGrowthRate: number;
    revenueGrowthRate: number;
  };
  
  downloadUrl?: string;          // Si format != 'json'
}

// POST /api/gym/reports/schedule
// Programar reporte automático (Business only)
interface ScheduleReportRequest {
  name: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  metrics: string[];
}
```

### Branding (Business)

```typescript
// PATCH /api/gym/branding
// Configurar branding
interface UpdateBrandingRequest {
  logoUrl?: string;              // S3 URL after upload
  primaryColor?: string;         // Hex
  secondaryColor?: string;
  accentColor?: string;
}

// POST /api/gym/branding/logo
// Upload logo
// Multipart form-data
// Response: { url: string }

// POST /api/gym/custom-domain
// Configurar dominio personalizado
interface SetCustomDomainRequest {
  domain: string;                // app.gymname.com
}

// POST /api/gym/custom-domain/verify
// Verificar dominio
// Response: { verified: boolean, dnsRecords: [...] }
```

### API Keys (Business)

```typescript
// POST /api/gym/api-keys
// Crear API key
interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expiresAt?: Date;
}

interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;                   // Plain text (solo se muestra una vez!)
  prefix: string;
  scopes: string[];
  createdAt: Date;
}

// GET /api/gym/api-keys
// Listar API keys (sin el secret)
interface ListApiKeysResponse {
  keys: Array<{
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    status: string;
    lastUsedAt?: Date;
    createdAt: Date;
  }>;
}

// DELETE /api/gym/api-keys/:id
// Revocar API key
```

### Webhooks (Business)

```typescript
// POST /api/gym/webhooks
// Crear webhook
interface CreateWebhookRequest {
  url: string;                   // HTTPS required
  events: WebhookEvent[];
}

interface CreateWebhookResponse {
  id: string;
  url: string;
  secret: string;                // Para firmar payloads
  events: string[];
  createdAt: Date;
}

// GET /api/gym/webhooks
// Listar webhooks
interface ListWebhooksResponse {
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    failureCount: number;
    lastSuccessAt?: Date;
    lastFailureAt?: Date;
  }>;
}

// GET /api/gym/webhooks/:id/deliveries
// Log de entregas
interface GetWebhookDeliveriesResponse {
  deliveries: Array<{
    id: string;
    event: string;
    status: string;
    statusCode?: number;
    attempts: number;
    createdAt: Date;
    deliveredAt?: Date;
  }>;
}

// POST /api/gym/webhooks/:id/test
// Enviar test event
interface TestWebhookRequest {
  event: WebhookEvent;
}
```

## 🔔 Webhook Delivery

### Payload Signature

```typescript
// Firmar payload con HMAC SHA-256
function signPayload(payload: object, secret: string): string {
  const json = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(json)
    .digest('hex');
}

// Verificar firma (en el receptor)
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Ejemplo de Payload

```typescript
// Event: trainer.added
{
  event: 'trainer.added',
  timestamp: '2025-03-15T10:30:00Z',
  gymId: 'gym_123',
  data: {
    trainerId: 'trainer_456',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'trainer',
    assignedPlan: 'pro',
  },
}

// Headers del request
{
  'Content-Type': 'application/json',
  'X-Webhook-Signature': 'sha256=abc123...',
  'X-Webhook-Event': 'trainer.added',
  'X-Webhook-Delivery-Id': 'delivery_789',
}
```

### Retry Logic

```typescript
// Reintentar con backoff exponencial
async function deliverWebhook(delivery: WebhookDelivery) {
  const webhook = await db.webhooks.findById(delivery.webhookId);
  
  const payload = {
    event: delivery.event,
    timestamp: new Date().toISOString(),
    gymId: webhook.gymId,
    data: delivery.payload,
  };
  
  const signature = signPayload(payload, webhook.secret);
  
  try {
    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Delivery-Id': delivery.id,
      },
      timeout: 10000,  // 10s
    });
    
    await db.webhookDeliveries.update(delivery.id, {
      status: 'success',
      statusCode: response.status,
      responseBody: JSON.stringify(response.data).substring(0, 1000),
      deliveredAt: new Date(),
    });
    
    // Reset failure count
    await db.webhooks.update(webhook.id, {
      failureCount: 0,
      lastSuccessAt: new Date(),
    });
    
  } catch (error) {
    const attempts = delivery.attempts + 1;
    const nextRetry = calculateNextRetry(attempts);
    
    await db.webhookDeliveries.update(delivery.id, {
      status: 'failed',
      statusCode: error.response?.status,
      responseBody: error.message,
      attempts,
      nextRetryAt: nextRetry,
    });
    
    // Incrementar failure count
    const failureCount = webhook.failureCount + 1;
    await db.webhooks.update(webhook.id, {
      failureCount,
      lastFailureAt: new Date(),
      status: failureCount >= 5 ? 'failed' : 'active',
    });
  }
}

function calculateNextRetry(attempts: number): Date {
  // 1m, 5m, 15m, 1h, 6h
  const delays = [60, 300, 900, 3600, 21600];
  const delay = delays[Math.min(attempts - 1, delays.length - 1)];
  
  return new Date(Date.now() + delay * 1000);
}
```

## ⏰ Cron Jobs

### Job: Generar reportes automáticos

```typescript
// Corre cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  
  const dueReports = await db.scheduledReports.findMany({
    where: {
      status: 'active',
      nextSendAt: { lte: now },
    },
  });
  
  for (const report of dueReports) {
    try {
      // Generar reporte
      const data = await generateReportData(report.gymId, report.metrics);
      
      // Formatear según tipo
      let fileUrl: string;
      if (report.format === 'pdf') {
        fileUrl = await generatePDF(data);
      } else if (report.format === 'csv') {
        fileUrl = await generateCSV(data);
      } else {
        fileUrl = await generateExcel(data);
      }
      
      // Enviar emails
      await sendReportEmails(report.recipients, report.name, fileUrl);
      
      // Guardar delivery
      await db.reportDeliveries.create({
        reportId: report.id,
        fileUrl,
        sentAt: now,
        recipients: report.recipients,
        status: 'sent',
      });
      
      // Calcular próximo envío
      const nextSend = calculateNextSchedule(report.frequency);
      await db.scheduledReports.update(report.id, {
        lastSentAt: now,
        nextSendAt: nextSend,
      });
      
    } catch (error) {
      await db.reportDeliveries.create({
        reportId: report.id,
        fileUrl: '',
        sentAt: now,
        recipients: report.recipients,
        status: 'failed',
        error: error.message,
      });
    }
  }
});
```

### Job: Reintentar webhooks fallidos

```typescript
// Corre cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  
  const pendingDeliveries = await db.webhookDeliveries.findMany({
    where: {
      status: 'failed',
      attempts: { lt: 5 },
      nextRetryAt: { lte: now },
    },
  });
  
  for (const delivery of pendingDeliveries) {
    await deliverWebhook(delivery);
  }
});
```

### Job: Alertas de gimnasio

```typescript
// Corre diariamente a las 9am
cron.schedule('0 9 * * *', async () => {
  const gyms = await db.gyms.findAll({ where: { plan: 'business' } });
  
  for (const gym of gyms) {
    const alerts = [];
    
    // Trainers sin clientes nuevos (30 días)
    const inactiveTrainers = await db.gymTrainers.findMany({
      where: {
        gymId: gym.id,
        status: 'active',
        trainer: {
          trainees: {
            none: {
              createdAt: { gte: thirtyDaysAgo() },
            },
          },
        },
      },
    });
    
    if (inactiveTrainers.length > 0) {
      alerts.push({
        type: 'trainer_inactive',
        count: inactiveTrainers.length,
        message: `${inactiveTrainers.length} entrenadores sin clientes nuevos en 30 días`,
      });
    }
    
    // Clientes inactivos (>7 días)
    const inactiveClients = await countInactiveClients(gym.id, 7);
    if (inactiveClients > 0) {
      alerts.push({
        type: 'client_inactive',
        count: inactiveClients,
        message: `${inactiveClients} clientes sin entrenar en 7+ días`,
      });
    }
    
    // Enviar notificación si hay alertas
    if (alerts.length > 0) {
      await sendGymAlerts(gym.id, alerts);
    }
  }
});
```

## 🧪 Testing

### Integration Tests

```typescript
describe('Gym Multi-Tenancy', () => {
  it('should isolate data between gyms', async () => {
    const gym1 = await createTestGym({ name: 'Gym A' });
    const gym2 = await createTestGym({ name: 'Gym B' });
    
    const trainer1 = await createTestTrainer({ gymId: gym1.id });
    const trainer2 = await createTestTrainer({ gymId: gym2.id });
    
    // Admin de gym1 no debe ver trainers de gym2
    const response = await request(app)
      .get('/api/gym/trainers')
      .set('Authorization', `Bearer ${gym1.adminToken}`)
      .expect(200);
    
    expect(response.body.trainers).toHaveLength(1);
    expect(response.body.trainers[0].id).toBe(trainer1.id);
  });
  
  it('should enforce plan limits', async () => {
    const gym = await createTestGym({ plan: 'free', maxTrainers: 2 });
    
    // Crear 2 trainers (OK)
    await createTestTrainer({ gymId: gym.id });
    await createTestTrainer({ gymId: gym.id });
    
    // Tercero debe fallar
    await expect(
      request(app)
        .post('/api/gym/trainers/invite')
        .set('Authorization', `Bearer ${gym.adminToken}`)
        .send({ email: 'third@test.com' })
    ).rejects.toThrow('Free plan limited to 2 trainers');
  });
});

describe('Webhook Delivery', () => {
  it('should sign payload correctly', () => {
    const payload = { event: 'test', data: {} };
    const secret = 'test_secret';
    
    const signature = signPayload(payload, secret);
    
    expect(signature).toHaveLength(64);  // SHA-256 hex
    expect(
      verifySignature(JSON.stringify(payload), signature, secret)
    ).toBe(true);
  });
  
  it('should retry failed deliveries', async () => {
    const webhook = await createTestWebhook({
      url: 'https://failing.example.com',
    });
    
    const delivery = await createTestDelivery({
      webhookId: webhook.id,
      status: 'failed',
      attempts: 2,
      nextRetryAt: new Date(),
    });
    
    await deliverWebhook(delivery);
    
    const updated = await db.webhookDeliveries.findById(delivery.id);
    expect(updated.attempts).toBe(3);
    expect(updated.nextRetryAt).toBeDefined();
  });
});
```

## 🚀 Performance

### Caching

```typescript
// Cache de stats del gym (invalidar cada 5 min)
async function getGymDashboard(gymId: string) {
  const cacheKey = `gym:${gymId}:dashboard`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const data = await calculateDashboardStats(gymId);
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}

// Cache de lista de trainers (invalidar al agregar/remover)
async function getGymTrainers(gymId: string) {
  const cacheKey = `gym:${gymId}:trainers`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const trainers = await db.gymTrainers.findMany({ where: { gymId } });
  await redis.setex(cacheKey, 600, JSON.stringify(trainers));
  
  return trainers;
}

// Invalidar cache al cambiar
async function addTrainerToGym(gymId: string, trainerId: string) {
  await db.gymTrainers.create({ gymId, trainerId });
  await redis.del(`gym:${gymId}:trainers`);
  await redis.del(`gym:${gymId}:dashboard`);
}
```

### Database Indexes

```sql
-- Queries de multi-tenant
CREATE INDEX idx_gym_trainers_tenant ON gym_trainers(gym_id, status);
CREATE INDEX idx_gym_clients_lookup ON trainees(id) 
  WHERE id IN (
    SELECT trainee_id FROM trainer_trainees 
    WHERE trainer_id IN (SELECT trainer_id FROM gym_trainers)
  );

-- Reportes
CREATE INDEX idx_workouts_period ON workout_logs(completed_at) 
  WHERE completed_at IS NOT NULL;
```

---

**Ver también:**
- [Features de Gimnasios](features.md)
- [Entrenadores - Technical](../trainers/technical.md)
- [Entrenados - Technical](../trainees/technical.md)
