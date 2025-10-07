# 💪 Entrenados - Especificaciones Técnicas

> Modelo de datos, arquitectura y detalles de implementación

## 🗄️ Modelo de Datos

### Entity: Trainee (User)

```typescript
interface Trainee {
  id: string;                    // UUID
  email: string;                 // Unique
  password: string;              // Hashed (bcrypt)
  name: string;
  avatar?: string;               // URL to S3/CDN
  
  // Plan
  plan: 'free' | 'premium';
  subscription?: {
    stripeCustomerId: string;
    subscriptionId: string;
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  
  // Preferences
  settings: {
    notifications: {
      newRoutine: boolean;
      reminders: boolean;
      reminderTime: string;      // "HH:mm" format
      achievements: boolean;
      messages: boolean;
      weeklySummary: boolean;
    };
    units: 'metric' | 'imperial';
    timezone: string;             // IANA timezone
    language: 'es' | 'en';
  };
  
  // Stats
  stats: {
    totalWorkouts: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate?: Date;
    totalVolume: number;          // kg levantados acumulados
    totalMinutes: number;         // minutos de entrenamiento
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  invitedBy?: string;             // Trainer ID que lo invitó
}
```

### Entity: RoutineAssignment

```typescript
interface RoutineAssignment {
  id: string;
  routineId: string;              // FK -> Routine
  traineeId: string;              // FK -> Trainee
  trainerId: string;              // FK -> Trainer (quien asignó)
  
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  progress: number;               // 0-100%
  
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Override de rutina (valores específicos para este usuario)
  customNotes?: string;
  targetDate?: Date;
}
```

### Entity: WorkoutLog

```typescript
interface WorkoutLog {
  id: string;
  traineeId: string;              // FK -> Trainee
  routineAssignmentId: string;    // FK -> RoutineAssignment
  routineId: string;              // FK -> Routine (snapshot)
  
  startedAt: Date;
  completedAt?: Date;
  duration: number;               // minutos
  notes?: string;
  
  exercises: WorkoutExercise[];
  
  stats: {
    totalVolume: number;          // kg levantados
    totalReps: number;
    caloriesBurned: number;       // estimado
  };
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;           // snapshot
  sets: WorkoutSet[];
  notes?: string;
}

interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  restSeconds?: number;
}
```

### Entity: PersonalRecord (PR)

```typescript
interface PersonalRecord {
  id: string;
  traineeId: string;
  exerciseId: string;
  exerciseName: string;
  
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time';
  value: number;
  unit: 'kg' | 'lbs' | 'reps' | 'seconds';
  
  workoutLogId: string;           // FK -> WorkoutLog
  achievedAt: Date;
  previousRecord?: {
    value: number;
    achievedAt: Date;
  };
}
```

## 🔗 Relaciones de Base de Datos

```sql
-- Relación N:M entre Trainers y Trainees
CREATE TABLE trainer_trainee (
  trainer_id UUID REFERENCES trainers(id),
  trainee_id UUID REFERENCES trainees(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, blocked
  PRIMARY KEY (trainer_id, trainee_id)
);

-- Asignaciones de rutinas
CREATE TABLE routine_assignments (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines(id),
  trainee_id UUID REFERENCES trainees(id),
  trainer_id UUID REFERENCES trainers(id),
  status VARCHAR(20),
  progress INT DEFAULT 0,
  assigned_at TIMESTAMP DEFAULT NOW(),
  -- indexes
  INDEX idx_trainee_status (trainee_id, status),
  INDEX idx_assigned_at (assigned_at)
);

-- Logs de entrenamientos
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY,
  trainee_id UUID REFERENCES trainees(id),
  routine_assignment_id UUID REFERENCES routine_assignments(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration INT,
  data JSONB, -- exercises, sets, etc.
  -- indexes
  INDEX idx_trainee_date (trainee_id, started_at DESC)
);
```

## 🔐 Autenticación y Autorización

### JWT Tokens

```typescript
interface JWTPayload {
  sub: string;                    // trainee.id
  email: string;
  role: 'trainee';
  plan: 'free' | 'premium';
  iat: number;                    // issued at
  exp: number;                    // expiration (7 days)
}

interface RefreshToken {
  token: string;                  // UUID
  traineeId: string;
  expiresAt: Date;                // 30 days
  createdAt: Date;
}
```

### Middleware de Validación de Plan

```typescript
// Ejemplo de middleware Express
function requirePlan(plan: 'free' | 'premium') {
  return (req, res, next) => {
    const user = req.user; // from JWT
    
    if (plan === 'premium' && user.plan !== 'premium') {
      return res.status(403).json({
        error: 'premium_required',
        message: 'Esta funcionalidad requiere Plan Premium'
      });
    }
    
    next();
  };
}

// Uso en rutas
app.get('/api/trainees/stats/advanced', 
  authenticate,
  requirePlan('premium'),
  getAdvancedStats
);
```

## 📡 API Endpoints

### Rutinas

```typescript
// Obtener rutinas asignadas
GET /api/trainees/me/routines
Query: status=pending|in_progress|completed
Response: RoutineAssignment[]

// Obtener detalle de rutina
GET /api/trainees/me/routines/:assignmentId
Response: {
  assignment: RoutineAssignment,
  routine: Routine,
  progress: WorkoutLog[]
}

// Iniciar workout
POST /api/trainees/me/workouts
Body: {
  routineAssignmentId: string
}
Response: WorkoutLog

// Actualizar workout (registrar sets)
PATCH /api/trainees/me/workouts/:workoutId
Body: {
  exercises: WorkoutExercise[]
}

// Completar workout
POST /api/trainees/me/workouts/:workoutId/complete
Response: {
  workout: WorkoutLog,
  newPRs: PersonalRecord[],
  streakUpdated: boolean
}
```

### Estadísticas

```typescript
// Stats básicas (Free)
GET /api/trainees/me/stats
Response: {
  totalWorkouts: number,
  currentStreak: number,
  longestStreak: number,
  recentWorkouts: WorkoutLog[] // últimos 10
}

// Stats avanzadas (Premium only)
GET /api/trainees/me/stats/advanced
Response: {
  volumeByWeek: { week: string, volume: number }[],
  minutesByWeek: { week: string, minutes: number }[],
  muscleGroupDistribution: { group: string, percentage: number }[],
  personalRecords: PersonalRecord[],
  monthComparison: {
    current: Stats,
    previous: Stats,
    change: number
  }
}
```

### Historial

```typescript
// Obtener historial de workouts
GET /api/trainees/me/history
Query: 
  - limit: number (Free: max 2, Premium: sin límite)
  - offset: number
  - trainerId?: string
  - from?: Date
  - to?: Date
Response: {
  workouts: WorkoutLog[],
  total: number,
  hasMore: boolean
}
```

### Exportación (Premium only)

```typescript
// Exportar rutina a PDF
POST /api/trainees/me/export/routine/:assignmentId/pdf
Response: { downloadUrl: string }

// Exportar historial a Excel
POST /api/trainees/me/export/history/excel
Query: from, to
Response: { downloadUrl: string }

// Generar imagen para compartir
POST /api/trainees/me/share/image
Body: {
  type: 'streak' | 'pr' | 'workout' | 'summary',
  data: any
}
Response: { imageUrl: string }
```

## 🔔 Sistema de Notificaciones

### Push Notifications (Firebase Cloud Messaging)

```typescript
interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'new_routine' | 'reminder' | 'achievement' | 'message';
}

// Servicio de notificaciones
class NotificationService {
  async sendNewRoutineNotification(traineeId: string, routine: Routine) {
    const trainee = await getTrainee(traineeId);
    if (!trainee.settings.notifications.newRoutine) return;
    
    await fcm.send({
      token: trainee.fcmToken,
      notification: {
        title: '🆕 Nueva rutina asignada',
        body: `${routine.trainer.name} te asignó: ${routine.title}`
      },
      data: {
        type: 'new_routine',
        routineId: routine.id
      }
    });
  }
}
```

### Cron Jobs

```typescript
// Recordatorios diarios
cron.schedule('0 * * * *', async () => {  // Cada hora
  const currentHour = moment().format('HH:00');
  
  const trainees = await db.trainees.find({
    'settings.notifications.reminders': true,
    'settings.notifications.reminderTime': currentHour,
    plan: { $in: ['free', 'premium'] }
  });
  
  for (const trainee of trainees) {
    const hasWorkoutToday = await checkWorkoutToday(trainee.id);
    if (!hasWorkoutToday) {
      await sendReminderNotification(trainee.id);
    }
  }
});

// Detectar inactividad (cada día a las 10am)
cron.schedule('0 10 * * *', async () => {
  const threeDaysAgo = moment().subtract(3, 'days');
  
  const inactiveTrainees = await db.trainees.find({
    'stats.lastWorkoutDate': { $lt: threeDaysAgo.toDate() },
    'settings.notifications.reminders': true
  });
  
  for (const trainee of inactiveTrainees) {
    await sendInactivityNotification(trainee.id);
  }
});
```

## 🚀 Roadmap Técnico

### Fase 1: MVP ✅
- [x] Autenticación JWT
- [x] CRUD perfil usuario
- [x] Ver rutinas asignadas
- [x] Registrar workouts
- [x] Stats básicas

### Fase 2: Freemium 🚧
- [ ] Integración Stripe (checkout, webhooks)
- [ ] Middleware validación de planes
- [ ] Límite historial (Free: 2)
- [ ] Watermark generator (Canvas/Sharp)
- [ ] Google AdMob integration

### Fase 3: Premium Features 📋
- [ ] Stats avanzadas (queries optimizadas)
- [ ] Exportación PDF (Puppeteer/PDFKit)
- [ ] Exportación Excel (xlsx library)
- [ ] Gráficas D3.js/Chart.js
- [ ] Chat WebSocket (si trainer Pro)

### Fase 4: IA y Gamificación 📋
- [ ] Recomendaciones ML (peso, descanso)
- [ ] Sistema de logros (badges)
- [ ] Predicción de PRs
- [ ] Feed social básico

## 🧪 Testing

### Unit Tests

```typescript
describe('WorkoutLog', () => {
  it('should calculate total volume correctly', () => {
    const workout = new WorkoutLog({
      exercises: [
        { sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }] },
        { sets: [{ reps: 8, weight: 60 }] }
      ]
    });
    
    expect(workout.calculateTotalVolume()).toBe(1480); // (10*50*2) + (8*60)
  });
});
```

### Integration Tests

```typescript
describe('POST /api/trainees/me/workouts/:id/complete', () => {
  it('should detect and create new PR', async () => {
    const response = await request(app)
      .post('/api/trainees/me/workouts/123/complete')
      .set('Authorization', `Bearer ${token}`)
      .send();
    
    expect(response.body.newPRs).toHaveLength(1);
    expect(response.body.newPRs[0].type).toBe('max_weight');
  });
});
```

## 📊 Performance y Escalabilidad

### Caching con Redis

```typescript
// Cache de stats básicas (5 minutos)
const stats = await redis.get(`trainee:${traineeId}:stats`);
if (stats) return JSON.parse(stats);

const freshStats = await calculateStats(traineeId);
await redis.setex(`trainee:${traineeId}:stats`, 300, JSON.stringify(freshStats));
return freshStats;
```

### Índices de BD

```sql
-- Optimizar queries frecuentes
CREATE INDEX idx_workout_logs_trainee_date 
  ON workout_logs(trainee_id, started_at DESC);

CREATE INDEX idx_routine_assignments_trainee_status 
  ON routine_assignments(trainee_id, status);

CREATE INDEX idx_personal_records_trainee_exercise 
  ON personal_records(trainee_id, exercise_id, achieved_at DESC);
```

---

**Ver también:**
- [Features](features.md)
- [Modelo General](../../business/model.md)
- [Arquitectura](../../architecture/overview.md)
