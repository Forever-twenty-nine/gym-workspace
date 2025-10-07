# 💪 Entrenados - Especificaciones Técnicas

> Modelo de datos, arquitectura y detalles de implementación

## 🗄️ Modelo de Datos

### Entity: Entrenado (Trainee)

**Modelo simplificado en Firebase:**

```typescript
interface Entrenado {
  id: string;                    // UID de Firebase Auth
  gimnasioId: string;            // FK -> Gimnasio (multi-tenancy)
  entrenadorId?: string;         // FK -> Entrenador que lo invitó
  activo: boolean;               // Estado de la cuenta
  fechaRegistro?: Date;
  objetivo?: Objetivo;           // 'BAJAR_PESO' | 'AUMENTAR_MUSCULO' | 'MANTENER_PESO'
}
```

**Datos adicionales en Firebase Auth:**
- `email`, `password`, `name`, `avatar` → Manejados por Firebase Authentication
- `plan` → Almacenado en User custom claims o colección separada

**Estadísticas y configuraciones:**
- Se almacenan en colecciones separadas para optimizar queries
- `entrenados/{id}/stats` → estadísticas de entrenamientos
- `entrenados/{id}/settings` → preferencias y notificaciones

### Entity: RutinaAsignada (RoutineAssignment)

```typescript
interface RutinaAsignada {
  id: string;
  rutinaId: string;               // FK -> Rutina
  entrenadoId: string;            // FK -> Entrenado
  entrenadorId: string;           // FK -> Entrenador (quien asignó)
  
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'archivada';
  progreso: number;               // 0-100%
  
  fechaAsignacion: Date;
  fechaInicio?: Date;
  fechaCompletada?: Date;
  
  notasPersonalizadas?: string;
  fechaObjetivo?: Date;
}
```

**Colección Firebase:** `rutinas_asignadas/{id}`

### Entity: RegistroEntrenamiento (WorkoutLog)

```typescript
interface RegistroEntrenamiento {
  id: string;
  entrenadoId: string;            // FK -> Entrenado
  rutinaAsignadaId: string;       // FK -> RutinaAsignada
  rutinaId: string;               // FK -> Rutina (snapshot)
  
  fechaInicio: Date;
  fechaCompletada?: Date;
  duracion: number;               // minutos
  notas?: string;
  
  ejercicios: EjercicioRealizado[];
  
  estadisticas: {
    volumenTotal: number;         // kg levantados
    repsTotal: number;
    caloriasQuemadas: number;     // estimado
  };
}

interface EjercicioRealizado {
  ejercicioId: string;
  nombreEjercicio: string;        // snapshot
  series: SerieRealizada[];
  notas?: string;
}

interface SerieRealizada {
  numeroSerie: number;
  repeticiones: number;
  peso: number;
  completada: boolean;
  descansoSegundos?: number;
}
```

**Colección Firebase:** `registros_entrenamiento/{id}`

### Entity: RecordPersonal (PR)

```typescript
interface RecordPersonal {
  id: string;
  entrenadoId: string;
  ejercicioId: string;
  nombreEjercicio: string;
  
  tipo: 'peso_maximo' | 'repeticiones_maximas' | 'volumen_maximo' | 'mejor_tiempo';
  valor: number;
  unidad: 'kg' | 'lbs' | 'reps' | 'seconds';
  
  registroEntrenamientoId: string; // FK -> RegistroEntrenamiento
  fechaLogro: Date;
  recordAnterior?: {
    valor: number;
    fechaLogro: Date;
  };
}
```

**Colección Firebase:** `records_personales/{id}`

## 🔥 Estructura Firebase

### Colecciones Principales

```
firestore/
├── gimnasios/{gimnasioId}
├── entrenadores/{entrenadorId}
├── entrenados/{entrenadoId}              ← Modelo principal
├── rutinas/{rutinaId}
├── rutinas_asignadas/{asignacionId}
├── registros_entrenamiento/{registroId}
├── records_personales/{recordId}
└── invitaciones/{invitacionId}
```

### Queries Comunes

```typescript
// Obtener entrenados de un gimnasio
const entrenadosRef = collection(db, 'entrenados');
const q = query(
  entrenadosRef, 
  where('gimnasioId', '==', gimnasioId),
  where('activo', '==', true)
);

// Obtener rutinas asignadas a un entrenado
const rutinasRef = collection(db, 'rutinas_asignadas');
const q = query(
  rutinasRef,
  where('entrenadoId', '==', entrenadoId),
  where('estado', 'in', ['pendiente', 'en_progreso']),
  orderBy('fechaAsignacion', 'desc')
);

// Historial de entrenamientos
const registrosRef = collection(db, 'registros_entrenamiento');
const q = query(
  registrosRef,
  where('entrenadoId', '==', entrenadoId),
  orderBy('fechaInicio', 'desc'),
  limit(plan === 'free' ? 2 : 100)
);
```

## 🔐 Autenticación con Firebase

### Firebase Authentication

```typescript
// Login es manejado por Firebase Auth SDK
import { signInWithEmailAndPassword } from 'firebase/auth';

const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // El token JWT es generado automáticamente por Firebase
  const token = await user.getIdToken();
  
  return { user, token };
};
```

### Custom Claims para Roles

```typescript
// Establecer custom claims (Admin SDK - Backend)
import { getAuth } from 'firebase-admin/auth';

await getAuth().setCustomUserClaims(userId, {
  role: 'entrenado',
  plan: 'free',
  gimnasioId: 'gym123'
});

// Verificar claims (Frontend)
const idTokenResult = await user.getIdTokenResult();
const role = idTokenResult.claims.role;
const plan = idTokenResult.claims.plan;
```

### Guards en Angular

```typescript
// Ejemplo de guard para verificar plan
export const premiumGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  
  const user = await auth.currentUser;
  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  
  const token = await user.getIdTokenResult();
  if (token.claims['plan'] !== 'premium') {
    // Mostrar modal de upgrade
    return false;
  }
  
  return true;
};
```

## 🔥 Arquitectura del Servicio

### Patrón Adapter + Signals

El servicio `EntrenadoService` utiliza un **patrón de adaptador** para desacoplar la lógica de negocio de Firebase:

```typescript
// Interface del adaptador
export interface IEntrenadoFirestoreAdapter {
  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void;
  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void;
  save(entrenado: Entrenado): Promise<void>;
  delete(id: string): Promise<void>;
}

// Servicio (gym-library)
@Injectable({ providedIn: 'root' })
export class EntrenadoService {
  private readonly _entrenados: WritableSignal<Entrenado[]> = signal<Entrenado[]>([]);
  private firestoreAdapter?: IEntrenadoFirestoreAdapter;
  
  // El adaptador se inyecta desde la aplicación (gym-admin o gym-app)
  setFirestoreAdapter(adapter: IEntrenadoFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
    this.initializeListener();
  }
  
  // Expone signal reactiva
  get entrenados(): Signal<Entrenado[]> {
    return this._entrenados.asReadonly();
  }
  
  // Operaciones CRUD
  async save(entrenado: Entrenado): Promise<void> { /*...*/ }
  async delete(id: string): Promise<void> { /*...*/ }
}
```

### Métodos Disponibles

```typescript
// 📊 Obtener todos los entrenados (signal reactiva)
entrenados: Signal<Entrenado[]>

// 📊 Obtener un entrenado específico por ID
getEntrenado(id: string): Signal<Entrenado | null>

// 💾 Guardar o actualizar entrenado
save(entrenado: Entrenado): Promise<void>

// 🗑️ Eliminar entrenado
delete(id: string): Promise<void>

// 🔍 Buscar por ID
getEntrenadoById(id: string): Signal<Entrenado | null>

// 🔍 Filtrar por objetivo
getEntrenadosByObjetivo(objetivo: string): Signal<Entrenado[]>

// 🔍 Filtrar por gimnasio
getEntrenadosByGimnasio(gimnasioId: string): Signal<Entrenado[]>

// 📊 Solo activos
getEntrenadosActivos(): Signal<Entrenado[]>

// 📊 Contadores
entrenadoCount: Signal<number>
entrenadoActivoCount: Signal<number>
```

### Uso en Componentes

```typescript
@Component({...})
export class EntrenadosListComponent {
  private entrenadoService = inject(EntrenadoService);
  
  // Signals computadas reactivas
  readonly entrenados = this.entrenadoService.entrenados;
  readonly activos = this.entrenadoService.getEntrenadosActivos();
  readonly total = this.entrenadoService.entrenadoCount;
  
  async guardar(entrenado: Entrenado) {
    await this.entrenadoService.save(entrenado);
  }
  
  async eliminar(id: string) {
    await this.entrenadoService.delete(id);
  }
}
```
```

## � Operaciones Firebase

### Servicios Angular

```typescript
// entrenado.service.ts
export class EntrenadoService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Obtener rutinas asignadas
  getRutinasAsignadas(estado?: string) {
    const userId = this.auth.currentUser?.uid;
    const ref = collection(this.firestore, 'rutinas_asignadas');
    
    let q = query(
      ref,
      where('entrenadoId', '==', userId)
    );
    
    if (estado) {
      q = query(q, where('estado', '==', estado));
    }
    
    return collectionData(q, { idField: 'id' });
  }

  // Iniciar entrenamiento
  async iniciarEntrenamiento(rutinaAsignadaId: string) {
    const ref = collection(this.firestore, 'registros_entrenamiento');
    const registro: RegistroEntrenamiento = {
      id: '',
      entrenadoId: this.auth.currentUser!.uid,
      rutinaAsignadaId,
      fechaInicio: new Date(),
      ejercicios: [],
      estadisticas: { volumenTotal: 0, repsTotal: 0, caloriasQuemadas: 0 }
    };
    
    return addDoc(ref, registro);
  }

  // Completar entrenamiento
  async completarEntrenamiento(registroId: string) {
    const ref = doc(this.firestore, 'registros_entrenamiento', registroId);
    await updateDoc(ref, {
      fechaCompletada: new Date()
    });
    
    // Actualizar estadísticas del usuario
    await this.actualizarStats();
  }
}

### Estadísticas

```typescript
// Obtener estadísticas básicas (Free)
getStatsBasicas() {
  const userId = this.auth.currentUser?.uid;
  const statsRef = doc(this.firestore, `entrenados/${userId}/stats/resumen`);
  return docData(statsRef);
}

// Obtener estadísticas avanzadas (Premium only)
async getStatsAvanzadas() {
  const plan = await this.getPlan();
  if (plan !== 'premium') {
    throw new Error('Requiere plan Premium');
  }
  
  // Query a colección de stats detalladas
  const ref = collection(this.firestore, `entrenados/${userId}/stats/detalladas`);
  return collectionData(ref);
}
```

### Historial

```typescript
// Obtener historial limitado según plan
async getHistorial(limite?: number) {
  const userId = this.auth.currentUser?.uid;
  const plan = await this.getPlan();
  
  const maxLimit = plan === 'free' ? 2 : (limite || 100);
  
  const ref = collection(this.firestore, 'registros_entrenamiento');
  const q = query(
    ref,
    where('entrenadoId', '==', userId),
    orderBy('fechaInicio', 'desc'),
    limit(maxLimit)
  );
  
  return collectionData(q, { idField: 'id' });
}
```

## 🔔 Notificaciones (Futuro)

> **Nota:** El sistema de notificaciones se implementará en fases posteriores.

Las notificaciones push requerirán:
- Firebase Cloud Messaging (FCM)
- Capacitor Push Notifications plugin (para gym-app)
- Cloud Functions para triggers automáticos
- Campo `fcmToken` en el documento de entrenado

## 🚀 Estado Actual

### ✅ Implementado
- Modelo `Entrenado` con 6 campos básicos
- Servicio con patrón Adapter para desacoplamiento
- Signals reactivas para state management
- Operaciones CRUD (save, delete)
- Métodos de búsqueda y filtrado
- Contadores y estadísticas básicas

### 📋 Pendiente (según roadmap)
- Modelo `RutinaAsignada`
- Modelo `RegistroEntrenamiento`
- Modelo `RecordPersonal`
- Sistema de notificaciones push
- Integración con planes (Free/Premium)
- Estadísticas avanzadas
- Exportación PDF/Excel

## 📊 Performance y Optimización

### Índices Compuestos en Firestore

```typescript
// Firestore composite indexes (firestore.indexes.json)
{
  "indexes": [
    {
      "collectionGroup": "rutinas_asignadas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entrenadoId", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fechaAsignacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "registros_entrenamiento",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entrenadoId", "order": "ASCENDING" },
        { "fieldPath": "fechaInicio", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Solo el entrenado puede ver sus propios datos
    match /entrenados/{entrenadoId} {
      allow read: if request.auth.uid == entrenadoId;
      allow write: if false; // Solo admin/cloud functions
    }
    
    // Rutinas asignadas
    match /rutinas_asignadas/{asignacionId} {
      allow read: if request.auth.uid == resource.data.entrenadoId
                  || request.auth.uid == resource.data.entrenadorId;
      allow write: if request.auth.uid == resource.data.entrenadorId;
    }
    
    // Registros de entrenamiento
    match /registros_entrenamiento/{registroId} {
      allow read: if request.auth.uid == resource.data.entrenadoId;
      allow create: if request.auth.uid == request.resource.data.entrenadoId;
      allow update: if request.auth.uid == resource.data.entrenadoId;
    }
  }
}
```

---

**Ver también:**
- [Features](features.md)
- [Modelo General](../../business/model.md)
- [Arquitectura](../../architecture/overview.md)
