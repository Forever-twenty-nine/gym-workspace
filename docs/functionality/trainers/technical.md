# 👨‍🏫 Entrenadores - Especificaciones Técnicas

> Data models, APIs, authentication, y arquitectura

## 📦 Data Models (TypeScript)

### Entidad Trainer

```typescript
interface Trainer {
  id: string;                    // UUID
  email: string;                 // unique, lowercase
  password: string;              // bcrypt hash
  name: string;
  bio?: string;                  // Optional bio
  profileImageUrl?: string;
  phone?: string;
  
  // Plan
  plan: 'free' | 'pro';
  planStartDate: Date;
  planExpiryDate?: Date;         // null si free
  
  // Certificación
  certificationLevel: 'none' | 'verified' | 'elite' | 'master';
  rating: number;                // Promedio 0-5
  totalRatings: number;
  
  // Branding (Pro only)
  customLogoUrl?: string;
  brandColor?: string;           // Hex color
  
  // Marketplace
  marketplaceActive: boolean;    // ¿Vende rutinas?
  totalSales: number;            // Count
  totalEarnings: number;         // USD cents
  availableBalance: number;      // USD cents (para retiro)
  commissionRate: number;        // 0.70 (70%), 0.75, 0.80
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Relations
  trainees: Trainee[];           // N:M
  routines: Routine[];           // 1:N
  invitations: Invitation[];     // 1:N
  chatMessages: ChatMessage[];   // 1:N
  calendarEvents: CalendarEvent[]; // 1:N
  privateNotes: PrivateNote[];   // 1:N
}
```

### Invitaciones

```typescript
interface Invitation {
  id: string;                    // UUID
  trainerId: string;             // FK
  email: string;                 // Email destino
  token: string;                 // Unique, used in link
  status: 'pending' | 'accepted' | 'expired';
  
  createdAt: Date;
  expiresAt: Date;               // 7 días desde creación
  acceptedAt?: Date;
  
  // Relations
  trainer: Trainer;
  trainee?: Trainee;             // Null hasta aceptar
}
```

### Rutina

```typescript
interface Routine {
  id: string;
  trainerId: string;
  
  title: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;     // minutos
  category: 'strength' | 'cardio' | 'hybrid' | 'mobility';
  
  // Marketplace
  isPublic: boolean;             // ¿Publicada en marketplace?
  price?: number;                // USD cents (null si no es pública)
  salesCount: number;
  averageRating?: number;
  
  // Estado
  status: 'draft' | 'active' | 'archived';
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  trainer: Trainer;
  exercises: RoutineExercise[];  // 1:N ordered
  assignments: RoutineAssignment[]; // N:M con Trainee
  purchases: RoutinePurchase[];  // Marketplace
}

interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;            // FK a Exercise (catálogo)
  
  order: number;                 // 1, 2, 3...
  sets: number;
  reps: number;
  weight?: number;               // kg
  restTime: number;              // segundos
  notes?: string;
  
  // Relations
  routine: Routine;
  exercise: Exercise;            // Catálogo global
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'other';
  videoUrl?: string;
  imageUrl?: string;
  
  createdAt: Date;
}
```

### Notas Privadas

```typescript
interface PrivateNote {
  id: string;
  trainerId: string;
  traineeId: string;
  
  content: string;               // Markdown supported
  tags?: string[];               // ['objetivo', 'limitacion']
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  trainer: Trainer;
  trainee: Trainee;
}
```

### Chat (WebSocket)

```typescript
interface ChatMessage {
  id: string;
  conversationId: string;        // trainerId:traineeId
  senderId: string;              // userId (trainer o trainee)
  senderType: 'trainer' | 'trainee';
  
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  
  read: boolean;
  readAt?: Date;
  
  createdAt: Date;
  
  // Relations
  sender: User;
}

interface ChatConversation {
  id: string;                    // `${trainerId}:${traineeId}`
  trainerId: string;
  traineeId: string;
  
  lastMessageAt: Date;
  lastMessage?: string;
  unreadCountTrainer: number;
  unreadCountTrainee: number;
  
  // Relations
  trainer: Trainer;
  trainee: Trainee;
  messages: ChatMessage[];
}
```

### Calendario

```typescript
interface CalendarEvent {
  id: string;
  trainerId: string;
  traineeId?: string;            // null si es personal
  
  title: string;
  description?: string;
  type: 'in-person' | 'online' | 'review' | 'reminder';
  
  startTime: Date;
  endTime: Date;
  location?: string;             // Dirección o Zoom link
  
  // Notificaciones
  notifyBefore: number;          // minutos (ej: 1440 = 24h)
  notificationSent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  trainer: Trainer;
  trainee?: Trainee;
}
```

### Marketplace

```typescript
interface RoutinePurchase {
  id: string;
  routineId: string;
  buyerId: string;               // Trainee or Trainer
  sellerId: string;              // Trainer
  
  price: number;                 // USD cents
  sellerEarnings: number;        // 70-80% según comisión
  platformFee: number;           // 20-30%
  
  status: 'completed' | 'refunded';
  
  purchasedAt: Date;
  refundedAt?: Date;
  
  // Relations
  routine: Routine;
  buyer: User;
  seller: Trainer;
}

interface RoutineReview {
  id: string;
  routineId: string;
  reviewerId: string;
  
  rating: number;                // 1-5
  comment?: string;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  routine: Routine;
  reviewer: User;
}
```

## 🗄️ Database Schema (SQL)

### Tabla `trainers`

```sql
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  phone VARCHAR(50),
  
  plan VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  plan_expiry_date TIMESTAMP,
  
  certification_level VARCHAR(20) DEFAULT 'none' 
    CHECK (certification_level IN ('none', 'verified', 'elite', 'master')),
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  
  custom_logo_url TEXT,
  brand_color VARCHAR(7),
  
  marketplace_active BOOLEAN DEFAULT FALSE,
  total_sales INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,      -- USD cents
  available_balance INTEGER DEFAULT 0,   -- USD cents
  commission_rate DECIMAL(3, 2) DEFAULT 0.70,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT valid_commission CHECK (commission_rate BETWEEN 0.50 AND 1.00)
);

CREATE INDEX idx_trainers_email ON trainers(email);
CREATE INDEX idx_trainers_plan ON trainers(plan);
CREATE INDEX idx_trainers_certification ON trainers(certification_level);
```

### Tabla `invitations`

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'expired')),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_trainer ON invitations(trainer_id);
CREATE INDEX idx_invitations_status ON invitations(status);
```

### Tabla `routines`

```sql
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER NOT NULL,  -- minutos
  category VARCHAR(20) NOT NULL CHECK (category IN ('strength', 'cardio', 'hybrid', 'mobility')),
  
  is_public BOOLEAN DEFAULT FALSE,
  price INTEGER,                        -- USD cents (null si privada)
  sales_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_price CHECK (price IS NULL OR price > 0),
  CONSTRAINT public_requires_price CHECK (NOT is_public OR price IS NOT NULL)
);

CREATE INDEX idx_routines_trainer ON routines(trainer_id);
CREATE INDEX idx_routines_public ON routines(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_routines_category ON routines(category);
```

### Tabla `routine_exercises`

```sql
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  
  "order" INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(5, 2),
  rest_time INTEGER NOT NULL,           -- segundos
  notes TEXT,
  
  CONSTRAINT valid_sets CHECK (sets > 0),
  CONSTRAINT valid_reps CHECK (reps > 0),
  CONSTRAINT valid_order CHECK ("order" > 0)
);

CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);
CREATE UNIQUE INDEX idx_routine_exercises_order ON routine_exercises(routine_id, "order");
```

### Tabla `exercises` (Catálogo)

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  muscle_group VARCHAR(50) NOT NULL 
    CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio')),
  equipment VARCHAR(50) NOT NULL 
    CHECK (equipment IN ('barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'other')),
  video_url TEXT,
  image_url TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);
CREATE INDEX idx_exercises_name ON exercises(name);
```

### Tabla `private_notes`

```sql
CREATE TABLE private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  tags TEXT[],
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(trainer_id, trainee_id)  -- Solo una nota por cliente
);

CREATE INDEX idx_private_notes_trainer ON private_notes(trainer_id);
CREATE INDEX idx_private_notes_trainee ON private_notes(trainee_id);
```

### Tabla `chat_messages`

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(100) NOT NULL,  -- trainerId:traineeId
  sender_id UUID NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('trainer', 'trainee')),
  
  content TEXT NOT NULL,
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  media_url TEXT,
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_unread ON chat_messages(conversation_id, read) WHERE read = FALSE;
```

### Tabla `calendar_events`

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  trainee_id UUID REFERENCES trainees(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in-person', 'online', 'review', 'reminder')),
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location TEXT,
  
  notify_before INTEGER DEFAULT 1440,   -- minutos
  notification_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_times CHECK (end_time > start_time)
);

CREATE INDEX idx_calendar_trainer ON calendar_events(trainer_id);
CREATE INDEX idx_calendar_trainee ON calendar_events(trainee_id);
CREATE INDEX idx_calendar_start ON calendar_events(start_time);
```

### Tabla `routine_purchases`

```sql
CREATE TABLE routine_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES trainers(id),
  
  price INTEGER NOT NULL,               -- USD cents
  seller_earnings INTEGER NOT NULL,     -- USD cents
  platform_fee INTEGER NOT NULL,        -- USD cents
  
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  refunded_at TIMESTAMP,
  
  CONSTRAINT valid_amounts CHECK (seller_earnings + platform_fee = price)
);

CREATE INDEX idx_purchases_routine ON routine_purchases(routine_id);
CREATE INDEX idx_purchases_buyer ON routine_purchases(buyer_id);
CREATE INDEX idx_purchases_seller ON routine_purchases(seller_id);
CREATE INDEX idx_purchases_date ON routine_purchases(purchased_at DESC);
```

## 🔐 Autenticación

### JWT Payload

```typescript
interface TrainerJWTPayload {
  sub: string;                   // trainer.id
  email: string;
  role: 'trainer';
  plan: 'free' | 'pro';
  certificationLevel: string;
  
  iat: number;                   // Issued at
  exp: number;                   // Expiry (7 days)
}
```

### Login Flow

```typescript
// POST /api/auth/trainer/login
async function loginTrainer(email: string, password: string) {
  const trainer = await db.trainers.findByEmail(email);
  if (!trainer) throw new UnauthorizedError('Invalid credentials');
  
  const valid = await bcrypt.compare(password, trainer.password);
  if (!valid) throw new UnauthorizedError('Invalid credentials');
  
  // Update last login
  await db.trainers.update(trainer.id, { lastLoginAt: new Date() });
  
  const token = jwt.sign(
    {
      sub: trainer.id,
      email: trainer.email,
      role: 'trainer',
      plan: trainer.plan,
      certificationLevel: trainer.certificationLevel,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { token, trainer };
}
```

## 🌐 API Endpoints

### Gestión de Clientes

```typescript
// GET /api/trainer/clients
// Retorna lista de clientes con métricas básicas
interface GetClientsResponse {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    currentRoutine?: {
      id: string;
      title: string;
      progress: number;  // 0-100
    };
    lastWorkout?: Date;
    adherence: number;   // 0-100
    status: 'active' | 'inactive';
  }>;
  totalCount: number;
  activeCount: number;
}

// GET /api/trainer/clients/:id
// Detalle completo de un cliente
interface GetClientDetailResponse {
  client: {
    id: string;
    name: string;
    email: string;
    plan: string;
    joinedAt: Date;
    
    metrics: {
      totalWorkouts: number;
      adherence: number;
      currentStreak: number;
      totalVolume: number;
    };
    
    currentRoutine?: {
      id: string;
      title: string;
      assignedAt: Date;
      progress: number;
    };
    
    routineHistory: Array<{
      id: string;
      title: string;
      assignedAt: Date;
      completedAt?: Date;
      status: string;
    }>;
    
    personalRecords: Array<{
      exerciseName: string;
      weight: number;
      date: Date;
    }>;
  };
  privateNote?: string;
}
```

### Invitaciones

```typescript
// POST /api/trainer/invitations
// Crear invitación
interface CreateInvitationRequest {
  email: string;
}

interface CreateInvitationResponse {
  invitation: {
    id: string;
    email: string;
    token: string;
    link: string;  // https://app.com/invite/{token}
    expiresAt: Date;
  };
}

// Middleware: Check límite free (3 clientes)
async function checkClientLimit(trainerId: string, plan: string) {
  if (plan === 'pro') return true;
  
  const activeCount = await db.trainees.countActiveByTrainer(trainerId);
  if (activeCount >= 3) {
    throw new ForbiddenError('Free plan limited to 3 active clients');
  }
  return true;
}

// GET /api/trainer/invitations
// Lista de invitaciones pendientes
interface GetInvitationsResponse {
  invitations: Array<{
    id: string;
    email: string;
    status: 'pending' | 'accepted' | 'expired';
    createdAt: Date;
    expiresAt: Date;
  }>;
}
```

### Rutinas

```typescript
// GET /api/trainer/routines
// Lista de rutinas del entrenador
interface GetRoutinesResponse {
  routines: Array<{
    id: string;
    title: string;
    difficulty: string;
    category: string;
    status: 'draft' | 'active' | 'archived';
    assignedCount: number;  // Cuántos clientes la tienen
    isPublic: boolean;
    salesCount?: number;
    createdAt: Date;
  }>;
  totalCount: number;
  draftCount: number;
  activeCount: number;
}

// POST /api/trainer/routines
// Crear rutina
interface CreateRoutineRequest {
  title: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  category: string;
  exercises: Array<{
    exerciseId: string;
    order: number;
    sets: number;
    reps: number;
    weight?: number;
    restTime: number;
    notes?: string;
  }>;
}

// Middleware: Check límite free (5 rutinas)
async function checkRoutineLimit(trainerId: string, plan: string) {
  if (plan === 'pro') return true;
  
  const activeCount = await db.routines.countActiveByTrainer(trainerId);
  if (activeCount >= 5) {
    throw new ForbiddenError('Free plan limited to 5 active routines');
  }
  return true;
}

// POST /api/trainer/routines/:id/assign
// Asignar rutina a cliente
interface AssignRoutineRequest {
  traineeId: string;
}

// POST /api/trainer/routines/:id/publish
// Publicar en marketplace (Pro only)
interface PublishRoutineRequest {
  price: number;  // USD cents
}
```

### Chat (WebSocket)

```typescript
// WS connection: wss://api.com/ws/chat
// Auth: JWT in query param ?token=xxx

interface ChatWSMessage {
  type: 'message' | 'typing' | 'read';
  conversationId: string;
  payload: any;
}

// Client → Server
interface SendMessagePayload {
  conversationId: string;  // trainerId:traineeId
  content: string;
  type: 'text' | 'image';
  mediaUrl?: string;
}

// Server → Client
interface ReceiveMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'trainer' | 'trainee';
  content: string;
  type: string;
  createdAt: Date;
}

// Typing indicator
interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

// Mark as read
interface ReadPayload {
  conversationId: string;
  messageIds: string[];
}
```

### Marketplace

```typescript
// GET /api/trainer/marketplace/sales
// Dashboard de ventas
interface GetSalesResponse {
  summary: {
    totalEarnings: number;        // USD cents
    availableBalance: number;     // USD cents
    totalSales: number;
    thisMonth: {
      earnings: number;
      sales: number;
    };
  };
  publishedRoutines: Array<{
    id: string;
    title: string;
    price: number;
    salesCount: number;
    earnings: number;
    rating: number;
    reviewCount: number;
  }>;
}

// POST /api/trainer/marketplace/withdraw
// Solicitar retiro de fondos
interface WithdrawRequest {
  amount: number;  // USD cents
  bankAccount: {
    accountNumber: string;
    routingNumber: string;
    accountHolder: string;
  };
}

// GET /api/marketplace/routines
// Buscar rutinas públicas (cualquier usuario)
interface SearchMarketplaceRequest {
  query?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}
```

### Calendario

```typescript
// GET /api/trainer/calendar/events
// Eventos del calendario
interface GetCalendarEventsRequest {
  startDate: string;  // ISO 8601
  endDate: string;
}

interface GetCalendarEventsResponse {
  events: Array<{
    id: string;
    title: string;
    type: string;
    startTime: Date;
    endTime: Date;
    trainee?: {
      id: string;
      name: string;
    };
    location?: string;
  }>;
}

// POST /api/trainer/calendar/events
// Crear evento
interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  type: 'in-person' | 'online' | 'review' | 'reminder';
  startTime: Date;
  endTime: Date;
  traineeId?: string;
  location?: string;
  notifyBefore: number;  // minutos
}
```

## ⚙️ Middleware

### Plan Validation

```typescript
// Middleware para endpoints Pro-only
function requireProPlan(req: Request, res: Response, next: NextFunction) {
  const { plan } = req.user as TrainerJWTPayload;
  
  if (plan !== 'pro') {
    return res.status(403).json({
      error: 'This feature requires Pro plan',
      upgradeUrl: '/pricing',
    });
  }
  
  next();
}

// Uso:
// router.post('/chat/send', requireProPlan, sendChatMessage);
```

## 🔔 Notificaciones Push (FCM)

### Casos de uso

```typescript
// 1. Cliente completó rutina
async function notifyRoutineCompleted(trainerId: string, trainee: Trainee) {
  await fcm.send(trainerId, {
    title: `${trainee.name} completó su rutina`,
    body: `Full Body 3x - 100% completada`,
    data: {
      type: 'routine_completed',
      traineeId: trainee.id,
    },
  });
}

// 2. Nuevo mensaje en chat (si offline)
async function notifyNewMessage(trainerId: string, trainee: Trainee, message: string) {
  const isOnline = await checkOnlineStatus(trainerId);
  if (isOnline) return;  // No notificar si está online
  
  await fcm.send(trainerId, {
    title: `Mensaje de ${trainee.name}`,
    body: message,
    data: {
      type: 'chat_message',
      conversationId: `${trainerId}:${trainee.id}`,
    },
  });
}

// 3. Cliente inactivo (alerta)
async function notifyInactiveClient(trainerId: string, trainee: Trainee, daysInactive: number) {
  await fcm.send(trainerId, {
    title: 'Cliente inactivo',
    body: `${trainee.name} lleva ${daysInactive} días sin entrenar`,
    data: {
      type: 'client_inactive',
      traineeId: trainee.id,
    },
  });
}

// 4. Nueva venta en marketplace
async function notifyNewSale(trainerId: string, routine: Routine, price: number) {
  await fcm.send(trainerId, {
    title: '¡Nueva venta! 🎉',
    body: `"${routine.title}" - $${(price / 100).toFixed(2)}`,
    data: {
      type: 'marketplace_sale',
      routineId: routine.id,
    },
  });
}
```

## ⏰ Cron Jobs

### Job 1: Revisar clientes inactivos

```typescript
// Corre diariamente a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  const trainers = await db.trainers.findAllActive();
  
  for (const trainer of trainers) {
    const inactiveClients = await db.trainees.findInactiveByTrainer(
      trainer.id,
      5 // días sin entrenar
    );
    
    for (const client of inactiveClients) {
      await notifyInactiveClient(trainer.id, client, client.daysInactive);
    }
  }
});
```

### Job 2: Recordatorios de calendario

```typescript
// Corre cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const eventsToNotify = await db.calendarEvents.findPending(now, in24h);
  
  for (const event of eventsToNotify) {
    if (event.notificationSent) continue;
    
    // Notificar al entrenador
    await fcm.send(event.trainerId, {
      title: 'Recordatorio de evento',
      body: `${event.title} - mañana a las ${formatTime(event.startTime)}`,
      data: {
        type: 'calendar_reminder',
        eventId: event.id,
      },
    });
    
    // Si tiene cliente asignado, notificarlo también
    if (event.traineeId) {
      await fcm.send(event.traineeId, {
        title: 'Tienes una sesión programada',
        body: `${event.title} - mañana a las ${formatTime(event.startTime)}`,
        data: {
          type: 'calendar_reminder',
          eventId: event.id,
        },
      });
    }
    
    // Marcar como enviado
    await db.calendarEvents.update(event.id, { notificationSent: true });
  }
});
```

### Job 3: Expirar invitaciones

```typescript
// Corre cada hora
cron.schedule('0 * * * *', async () => {
  const now = new Date();
  
  await db.invitations.updateMany(
    { status: 'pending', expiresAt: { $lt: now } },
    { status: 'expired' }
  );
});
```

### Job 4: Calcular certificaciones

```typescript
// Corre diariamente a medianoche
cron.schedule('0 0 * * *', async () => {
  const trainers = await db.trainers.findAll();
  
  for (const trainer of trainers) {
    const stats = await calculateTrainerStats(trainer.id);
    
    let newLevel = trainer.certificationLevel;
    
    // Master Trainer
    if (
      stats.monthsActive >= 12 &&
      stats.totalClients >= 50 &&
      trainer.rating >= 4.8
    ) {
      newLevel = 'master';
    }
    // Elite
    else if (
      stats.monthsActive >= 6 &&
      stats.totalClients >= 20 &&
      trainer.rating >= 4.5
    ) {
      newLevel = 'elite';
    }
    // Verified
    else if (
      stats.routinesCreated >= 10 &&
      stats.activeClients >= 3 &&
      trainer.rating >= 4.0
    ) {
      newLevel = 'verified';
    }
    
    // Actualizar solo si cambió
    if (newLevel !== trainer.certificationLevel) {
      await db.trainers.update(trainer.id, {
        certificationLevel: newLevel,
        commissionRate: getCommissionRate(newLevel),
      });
      
      // Notificar
      await fcm.send(trainer.id, {
        title: '¡Certificación actualizada! 🎉',
        body: `Ahora eres ${getLevelName(newLevel)}`,
        data: { type: 'certification_upgrade' },
      });
    }
  }
});

function getCommissionRate(level: string): number {
  switch (level) {
    case 'master': return 0.80;
    case 'elite': return 0.75;
    case 'verified': return 0.70;
    default: return 0.70;
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('Trainer Service', () => {
  describe('createInvitation', () => {
    it('should create invitation with valid token', async () => {
      const trainer = await createTestTrainer({ plan: 'free' });
      const invitation = await trainerService.createInvitation(
        trainer.id,
        'client@test.com'
      );
      
      expect(invitation.token).toHaveLength(64);
      expect(invitation.email).toBe('client@test.com');
      expect(invitation.status).toBe('pending');
    });
    
    it('should reject if free plan has 3 active clients', async () => {
      const trainer = await createTestTrainer({ plan: 'free' });
      await createTestClients(trainer.id, 3);
      
      await expect(
        trainerService.createInvitation(trainer.id, 'new@test.com')
      ).rejects.toThrow('Free plan limited to 3 active clients');
    });
    
    it('should allow unlimited invitations for pro', async () => {
      const trainer = await createTestTrainer({ plan: 'pro' });
      await createTestClients(trainer.id, 10);
      
      const invitation = await trainerService.createInvitation(
        trainer.id,
        'new@test.com'
      );
      
      expect(invitation).toBeDefined();
    });
  });
  
  describe('createRoutine', () => {
    it('should enforce 5-routine limit on free plan', async () => {
      const trainer = await createTestTrainer({ plan: 'free' });
      await createTestRoutines(trainer.id, 5);
      
      await expect(
        trainerService.createRoutine(trainer.id, { title: 'New' })
      ).rejects.toThrow('Free plan limited to 5 active routines');
    });
  });
});
```

### Integration Tests

```typescript
describe('Marketplace API', () => {
  it('should calculate correct commission split', async () => {
    const seller = await createTestTrainer({
      plan: 'pro',
      certificationLevel: 'elite',
      commissionRate: 0.75,
    });
    
    const routine = await createTestRoutine(seller.id, {
      isPublic: true,
      price: 2000, // $20.00
    });
    
    const buyer = await createTestTrainee();
    
    const purchase = await request(app)
      .post(`/api/marketplace/routines/${routine.id}/buy`)
      .set('Authorization', `Bearer ${buyer.token}`)
      .expect(200);
    
    expect(purchase.body.price).toBe(2000);
    expect(purchase.body.sellerEarnings).toBe(1500); // 75%
    expect(purchase.body.platformFee).toBe(500);     // 25%
    
    // Verificar balance
    const updatedSeller = await db.trainers.findById(seller.id);
    expect(updatedSeller.availableBalance).toBe(1500);
  });
});
```

## 🚀 Performance

### Caching (Redis)

```typescript
// Cache de rutinas públicas (marketplace)
async function getCachedMarketplaceRoutines(filters: any) {
  const cacheKey = `marketplace:${JSON.stringify(filters)}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const routines = await db.routines.findPublic(filters);
  await redis.setex(cacheKey, 3600, JSON.stringify(routines)); // 1h TTL
  
  return routines;
}

// Invalidar cache al publicar/despublicar
async function publishRoutine(routineId: string) {
  await db.routines.update(routineId, { isPublic: true });
  await redis.del('marketplace:*'); // Invalidar todos
}
```

### Database Indexes

```sql
-- Queries más comunes
CREATE INDEX idx_routines_trainer_status ON routines(trainer_id, status);
CREATE INDEX idx_chat_messages_unread ON chat_messages(conversation_id, read) WHERE read = FALSE;
CREATE INDEX idx_calendar_upcoming ON calendar_events(trainer_id, start_time) WHERE start_time > NOW();
```

---

**Ver también:**
- [Features de Entrenadores](features.md)
- [Entrenados - Technical](../trainees/technical.md)
- [Gimnasios - Technical](../gyms/technical.md)
