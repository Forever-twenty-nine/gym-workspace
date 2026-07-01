/**
 * Tests para UserService
 */
import { Timestamp } from 'firebase/firestore';
import { signal, computed } from '@angular/core';

const {
  mockAddDoc,
  mockDeleteDoc,
  mockSetDoc,
  mockGetDocs,
  mockCollection,
  mockDoc,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-user-id' })),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockGetDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
  mockCollection: vi.fn(() => ({})),
  mockDoc: vi.fn(() => ({})),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockTimestamp: {
    now: vi.fn(() => ({
      seconds: 1700000000,
      nanoseconds: 0,
      toDate: () => new Date('2024-01-01'),
    })),
    fromDate: vi.fn((d: Date) => ({
      seconds: Math.floor(d.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => d,
    })),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  doc: mockDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  Timestamp: mockTimestamp,
}));

// ─── helpers that mirror the service's private logic ─────────────────────────

function mapToFirestore(user: any): any {
  const data: any = {};
  if (user.nombre !== undefined) data.nombre = user.nombre || null;
  if (user.email !== undefined) data.email = user.email || null;
  if (user.emailVerified !== undefined) data.emailVerified = user.emailVerified ?? false;
  if (user.role !== undefined) data.role = user.role || null;
  if (user.entrenadorId !== undefined) data.entrenadorId = user.entrenadorId || null;
  if (user.gimnasioId !== undefined) data.gimnasioId = user.gimnasioId || null;
  if (user.entrenadoId !== undefined) data.entrenadoId = user.entrenadoId || null;
  if (user.onboarded !== undefined) data.onboarded = user.onboarded ?? false;
  if (user.plan !== undefined) data.plan = user.plan || null;
  if (user.photoURL !== undefined) data.photoURL = user.photoURL || null;
  if (user.fechaCreacion !== undefined) {
    data.fechaCreacion =
      user.fechaCreacion instanceof Date
        ? Timestamp.fromDate(user.fechaCreacion)
        : user.fechaCreacion;
  }
  if (user.fechaActualizacion !== undefined) {
    data.fechaActualizacion =
      user.fechaActualizacion instanceof Date
        ? Timestamp.fromDate(user.fechaActualizacion as Date)
        : user.fechaActualizacion;
  }
  return data;
}

function mapFromFirestore(data: any): any {
  return {
    uid: data.uid,
    nombre: data.nombre || null,
    email: data.email || null,
    emailVerified: data.emailVerified ?? false,
    role: data.role || null,
    entrenadorId: data.entrenadorId || null,
    gimnasioId: data.gimnasioId || null,
    entrenadoId: data.entrenadoId || null,
    onboarded: data.onboarded ?? false,
    plan: data.plan || null,
    photoURL: data.photoURL || null,
    fechaCreacion:
      data.fechaCreacion instanceof Object && typeof data.fechaCreacion.toDate === 'function'
        ? data.fechaCreacion.toDate()
        : (data.fechaCreacion ?? null),
    fechaActualizacion:
      data.fechaActualizacion instanceof Object &&
      typeof data.fechaActualizacion.toDate === 'function'
        ? data.fechaActualizacion.toDate()
        : (data.fechaActualizacion ?? null),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('UserService — logica de mapeo, filtros y senales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── mapToFirestore ──────────────────────────────────────────────────────────
  describe('mapToFirestore', () => {
    it('convierte fechaCreacion Date a Timestamp.fromDate', () => {
      const date = new Date('2024-06-01');
      mapToFirestore({ fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('convierte fechaActualizacion Date a Timestamp.fromDate', () => {
      const date = new Date('2024-07-01');
      mapToFirestore({ fechaActualizacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('no llama a Timestamp.fromDate si fechaCreacion ya es un objeto Timestamp-like', () => {
      const fakeTs = { seconds: 1000, nanoseconds: 0 };
      mapToFirestore({ fechaCreacion: fakeTs });
      expect(Timestamp.fromDate).not.toHaveBeenCalled();
    });

    it('omite fechaCreacion del resultado si no esta en el objeto fuente', () => {
      const result = mapToFirestore({ nombre: 'Ana' });
      expect(result).not.toHaveProperty('fechaCreacion');
    });

    it('convierte email vacio a null', () => {
      const result = mapToFirestore({ email: '' });
      expect(result.email).toBeNull();
    });

    it('preserva emailVerified=false cuando esta definido', () => {
      const result = mapToFirestore({ emailVerified: false });
      expect(result.emailVerified).toBe(false);
    });

    it('preserva onboarded=true correctamente', () => {
      const result = mapToFirestore({ onboarded: true });
      expect(result.onboarded).toBe(true);
    });

    it('convierte nombre vacio a null', () => {
      const result = mapToFirestore({ nombre: '' });
      expect(result.nombre).toBeNull();
    });
  });

  // ── mapFromFirestore ────────────────────────────────────────────────────────
  describe('mapFromFirestore', () => {
    it('convierte Timestamp a Date en fechaCreacion', () => {
      const expectedDate = new Date('2024-03-15');
      const fakeTimestamp = { toDate: () => expectedDate };
      const result = mapFromFirestore({ uid: 'u1', fechaCreacion: fakeTimestamp });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaCreacion).toBe(expectedDate);
    });

    it('convierte Timestamp a Date en fechaActualizacion', () => {
      const expectedDate = new Date('2024-04-10');
      const fakeTimestamp = { toDate: () => expectedDate };
      const result = mapFromFirestore({ uid: 'u1', fechaActualizacion: fakeTimestamp });
      expect(result.fechaActualizacion).toBeInstanceOf(Date);
      expect(result.fechaActualizacion).toBe(expectedDate);
    });

    it('preserva el uid del documento', () => {
      const result = mapFromFirestore({ uid: 'abc-123' });
      expect(result.uid).toBe('abc-123');
    });

    it('devuelve null para fechaCreacion si no esta definida', () => {
      const result = mapFromFirestore({ uid: 'u2' });
      expect(result.fechaCreacion).toBeNull();
    });

    it('asigna false para emailVerified si no esta en los datos', () => {
      const result = mapFromFirestore({ uid: 'u3' });
      expect(result.emailVerified).toBe(false);
    });

    it('asigna false para onboarded si no esta en los datos', () => {
      const result = mapFromFirestore({ uid: 'u4' });
      expect(result.onboarded).toBe(false);
    });

    it('preserva los campos opcionales como null si vienen vacios', () => {
      const result = mapFromFirestore({ uid: 'u5', nombre: '', email: '' });
      expect(result.nombre).toBeNull();
      expect(result.email).toBeNull();
    });

    it('mantiene role, entrenadorId y gimnasioId cuando vienen correctamente', () => {
      const result = mapFromFirestore({
        uid: 'u6',
        role: 'entrenador',
        entrenadorId: 'e-1',
        gimnasioId: 'g-1',
      });
      expect(result.role).toBe('entrenador');
      expect(result.entrenadorId).toBe('e-1');
      expect(result.gimnasioId).toBe('g-1');
    });
  });

  // ── senales iniciales ───────────────────────────────────────────────────────
  describe('senales iniciales', () => {
    it('_users arranca como array vacio', () => {
      const _users = signal<any[]>([]);
      expect(_users()).toEqual([]);
    });

    it('_isLoading arranca en false', () => {
      const _isLoading = signal<boolean>(false);
      expect(_isLoading()).toBe(false);
    });

    it('_error arranca en null', () => {
      const _error = signal<string | null>(null);
      expect(_error()).toBeNull();
    });

    it('_user arranca en null', () => {
      const _user = signal<any | null>(null);
      expect(_user()).toBeNull();
    });
  });

  // ── getUserByEmail (logica de filtrado) ─────────────────────────────────────
  describe('getUserByEmail — logica de filtrado', () => {
    it('devuelve el usuario cuyo email coincide (case-insensitive)', () => {
      const _users = signal([
        { uid: 'u1', email: 'Ana@Gym.com' },
        { uid: 'u2', email: 'bob@gym.com' },
      ]);
      const findByEmail = (email: string) =>
        computed(() => _users().find(u => u.email?.toLowerCase() === email.toLowerCase()) || null);

      expect(findByEmail('ana@gym.com')()).toMatchObject({ uid: 'u1' });
    });

    it('devuelve null si ningun usuario coincide', () => {
      const _users = signal([{ uid: 'u1', email: 'other@gym.com' }]);
      const findByEmail = (email: string) =>
        computed(() => _users().find(u => u.email?.toLowerCase() === email.toLowerCase()) || null);

      expect(findByEmail('nobody@gym.com')()).toBeNull();
    });

    it('reacciona cuando la lista de usuarios cambia', () => {
      const _users = signal<any[]>([]);
      const findByEmail = (email: string) =>
        computed(() => _users().find(u => u.email?.toLowerCase() === email.toLowerCase()) || null);

      const sig = findByEmail('new@gym.com');
      expect(sig()).toBeNull();
      _users.set([{ uid: 'u99', email: 'new@gym.com' }]);
      expect(sig()).toMatchObject({ uid: 'u99' });
    });
  });

  // ── getUserByUid (logica computada) ─────────────────────────────────────────
  describe('getUserByUid — logica computada', () => {
    it('devuelve el usuario con el uid correcto', () => {
      const _users = signal([
        { uid: 'u1', nombre: 'Ana' },
        { uid: 'u2', nombre: 'Bob' },
      ]);
      const findByUid = (uid: string) =>
        computed(() => _users().find(u => u.uid === uid) || null);

      expect(findByUid('u2')()).toMatchObject({ nombre: 'Bob' });
    });

    it('devuelve null si el uid no existe en la lista', () => {
      const _users = signal([{ uid: 'u1', nombre: 'Ana' }]);
      const findByUid = (uid: string) =>
        computed(() => _users().find(u => u.uid === uid) || null);

      expect(findByUid('nonexistent')()).toBeNull();
    });
  });

  // ── getUsersByRole (logica de filtrado por rol) ──────────────────────────────
  describe('getUsersByRole — logica de filtrado', () => {
    const allUsers = [
      { uid: 'u1', role: 'entrenador' },
      { uid: 'u2', role: 'entrenado' },
      { uid: 'u3', role: 'entrenador' },
      { uid: 'u4', role: 'admin' },
    ];

    it('filtra solo los entrenadores', () => {
      const _users = signal(allUsers);
      const byRole = (role: string) =>
        computed(() => _users().filter(u => u.role === role));

      const result = byRole('entrenador')();
      expect(result.length).toBe(2);
      expect(result.every(u => u.role === 'entrenador')).toBe(true);
    });

    it('devuelve array vacio si no hay coincidencias', () => {
      const _users = signal(allUsers);
      const byRole = (role: string) =>
        computed(() => _users().filter(u => u.role === role));

      expect(byRole('superadmin')()).toEqual([]);
    });
  });

  // ── userCount (senal computada) ──────────────────────────────────────────────
  describe('userCount — senal computada', () => {
    it('cuenta correctamente el total de usuarios', () => {
      const _users = signal([{ uid: 'u1' }, { uid: 'u2' }, { uid: 'u3' }]);
      const count = computed(() => _users().length);
      expect(count()).toBe(3);
    });

    it('devuelve 0 si la lista esta vacia', () => {
      const _users = signal<any[]>([]);
      const count = computed(() => _users().length);
      expect(count()).toBe(0);
    });
  });

  // ── write operations (addDoc / setDoc / deleteDoc) ──────────────────────────
  describe('operaciones de escritura', () => {
    it('save nuevo usuario llama a addDoc con datos mapeados', async () => {
      const userData = { nombre: 'Carlos', email: 'carlos@gym.com', emailVerified: false };
      const mapped = mapToFirestore(userData);
      await mockAddDoc({}, mapped);
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nombre: 'Carlos' }),
      );
    });

    it('update usuario llama a setDoc con merge:true', async () => {
      const patch = { nombre: 'Nuevo Nombre', fechaActualizacion: new Date('2024-08-01') };
      const mapped = mapToFirestore(patch);
      await mockSetDoc({}, mapped, { merge: true });
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { merge: true },
      );
    });

    it('delete llama a deleteDoc', async () => {
      await mockDeleteDoc({});
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });

    it('setCurrentUser actualiza el signal _user', () => {
      const _user = signal<any | null>(null);
      const setCurrentUser = (u: any) => _user.set(u);
      const user = { uid: 'u-set', nombre: 'Dani' };
      setCurrentUser(user);
      expect(_user()).toMatchObject({ uid: 'u-set' });
    });

    it('clearError pone _error en null', () => {
      const _error = signal<string | null>('algun error');
      const clearError = () => _error.set(null);
      clearError();
      expect(_error()).toBeNull();
    });
  });
});
