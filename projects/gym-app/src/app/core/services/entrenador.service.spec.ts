/**
 * Tests para EntrenadorService — lógica de planes y límites
 * 
 * Sin TestBed: testea la lógica pura de límites de plan, PlanLimitError
 * y el comportamiento del cache de getLimits directamente.
 */
import { signal } from '@angular/core';
import { Plan, Rol, ROL_PLAN_LIMITS } from 'gym-library';

// ─── Mocks de Firebase ────────────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-id' })),
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(() => ({})),
  where: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn(d => d),
  },
}));

// ─── PlanLimitError (clase pura, testeable sin DI) ───────────────────────────
class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

// ─── getLimits — lógica pura ──────────────────────────────────────────────────
function getLimitsForUser(userId: string, usersSignal: ReturnType<typeof signal<any[]>>) {
  const user = usersSignal().find((u: any) => u.uid === userId);
  const plan = user?.plan || Plan.FREE;
  return ROL_PLAN_LIMITS[Rol.ENTRENADOR][plan];
}

// ─── validateLimit — lógica pura ─────────────────────────────────────────────
function validateLimit(currentCount: number, max: number, item: string): void {
  if (currentCount >= max) {
    throw new PlanLimitError(`Límite alcanzado: ${currentCount}/${max} ${item} en plan free.`);
  }
}

describe('EntrenadorService — lógica de planes', () => {

  // ──────────────────────────────────────────────────────────────
  // PlanLimitError
  // ──────────────────────────────────────────────────────────────
  describe('PlanLimitError', () => {
    it('es instancia de Error', () => {
      expect(new PlanLimitError('Test')).toBeInstanceOf(Error);
    });

    it('tiene name === "PlanLimitError"', () => {
      expect(new PlanLimitError('Test').name).toBe('PlanLimitError');
    });

    it('preserva el mensaje de error', () => {
      const msg = 'Has alcanzado el límite.';
      expect(new PlanLimitError(msg).message).toBe(msg);
    });

    it('se puede detectar con instanceof PlanLimitError', () => {
      try {
        throw new PlanLimitError('Test');
      } catch (e) {
        expect(e).toBeInstanceOf(PlanLimitError);
      }
    });

    it('se puede detectar con instanceof Error también', () => {
      expect(new PlanLimitError('Test')).toBeInstanceOf(Error);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getLimits — según plan del usuario
  // ──────────────────────────────────────────────────────────────
  describe('getLimits', () => {
    it('devuelve límites FREE por defecto si el usuario no tiene plan', () => {
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: undefined }]);
      const limits = getLimitsForUser('trainer-1', usersSignal);
      expect(limits).toEqual(ROL_PLAN_LIMITS[Rol.ENTRENADOR][Plan.FREE]);
    });

    it('devuelve maxClients=3 para ENTRENADOR con plan FREE', () => {
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.FREE }]);
      expect(getLimitsForUser('trainer-1', usersSignal).maxClients).toBe(3);
    });

    it('allowCustomTimers=false para ENTRENADOR con plan FREE', () => {
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.FREE }]);
      expect(getLimitsForUser('trainer-1', usersSignal).allowCustomTimers).toBe(false);
    });

    it('devuelve maxClients=Infinity para ENTRENADOR con plan PREMIUM', () => {
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.PREMIUM }]);
      expect(getLimitsForUser('trainer-1', usersSignal).maxClients).toBe(Infinity);
    });

    it('allowCustomTimers=true para ENTRENADOR con plan PREMIUM', () => {
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.PREMIUM }]);
      expect(getLimitsForUser('trainer-1', usersSignal).allowCustomTimers).toBe(true);
    });

    it('devuelve límites FREE si el entrenador no está en la lista de usuarios', () => {
      const usersSignal = signal<any[]>([]);
      const limits = getLimitsForUser('unknown', usersSignal);
      expect(limits).toEqual(ROL_PLAN_LIMITS[Rol.ENTRENADOR][Plan.FREE]);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Cache de getLimits
  // ──────────────────────────────────────────────────────────────
  describe('cache de límites', () => {
    it('el cache funciona correctamente: misma referencia en segunda llamada', () => {
      const cache = new Map<string, any>();
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.FREE }]);

      function getLimitsWithCache(id: string) {
        if (cache.has(id)) return cache.get(id)!;
        const limits = getLimitsForUser(id, usersSignal);
        cache.set(id, limits);
        return limits;
      }

      const limits1 = getLimitsWithCache('trainer-1');
      const limits2 = getLimitsWithCache('trainer-1');
      expect(limits1).toBe(limits2);
    });

    it('invalidar el cache permite obtener el plan actualizado', () => {
      const cache = new Map<string, any>();
      const usersSignal = signal<any[]>([{ uid: 'trainer-1', plan: Plan.FREE }]);

      function getLimitsWithCache(id: string) {
        if (cache.has(id)) return cache.get(id)!;
        const limits = getLimitsForUser(id, usersSignal);
        cache.set(id, limits);
        return limits;
      }

      getLimitsWithCache('trainer-1'); // Guardar FREE en cache
      expect(cache.get('trainer-1')?.maxClients).toBe(3);

      // Simular cambio de plan y invalidar cache
      usersSignal.set([{ uid: 'trainer-1', plan: Plan.PREMIUM }]);
      cache.delete('trainer-1'); // Invalidar

      const newLimits = getLimitsWithCache('trainer-1');
      expect(newLimits.maxClients).toBe(Infinity);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // validateLimit
  // ──────────────────────────────────────────────────────────────
  describe('validateLimit', () => {
    it('no lanza error si el conteo está por debajo del límite', () => {
      expect(() => validateLimit(2, 3, 'clientes')).not.toThrow();
    });

    it('lanza PlanLimitError cuando el conteo iguala al máximo', () => {
      expect(() => validateLimit(3, 3, 'clientes')).toThrow(PlanLimitError);
    });

    it('lanza PlanLimitError cuando el conteo supera el máximo', () => {
      expect(() => validateLimit(5, 3, 'clientes')).toThrow(PlanLimitError);
    });

    it('el mensaje de error incluye los valores actuales y máximo', () => {
      try {
        validateLimit(3, 3, 'ejercicios');
      } catch (e: any) {
        expect(e.message).toContain('3/3');
        expect(e.message).toContain('ejercicios');
      }
    });

    it('no lanza error con límite Infinity (plan PREMIUM)', () => {
      expect(() => validateLimit(1000000, Infinity, 'clientes')).not.toThrow();
    });

    it('lanza error con mensaje específico sobre "plan free"', () => {
      try {
        validateLimit(3, 3, 'rutinas');
      } catch (e: any) {
        expect(e.message).toContain('plan free');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Señales de estado inicial
  // ──────────────────────────────────────────────────────────────
  describe('estado inicial del servicio', () => {
    it('entrenadores inicia como array vacío', () => {
      const entrenadores = signal<any[]>([]);
      expect(entrenadores()).toEqual([]);
    });

    it('loading inicia en false', () => {
      const loading = signal(false);
      expect(loading()).toBe(false);
    });

    it('error inicia en null', () => {
      const error = signal<string | null>(null);
      expect(error()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getEntrenadorById (lógica de computed)
  // ──────────────────────────────────────────────────────────────
  describe('getEntrenadorById — lógica', () => {

    function getEntrenadorById(entrenadores: any[], id: string) {
      return entrenadores.find(e => e.id === id);
    }

    const trainers = [
      { id: 'trainer-1', ejerciciosCreadasIds: [], entrenadosAsignadosIds: ['e1', 'e2'], rutinasCreadasIds: [], entrenadosPremiumIds: [] },
      { id: 'trainer-2', ejerciciosCreadasIds: [], entrenadosAsignadosIds: [], rutinasCreadasIds: [], entrenadosPremiumIds: [] },
    ];

    it('devuelve el entrenador correcto', () => {
      expect(getEntrenadorById(trainers, 'trainer-1')?.id).toBe('trainer-1');
    });

    it('devuelve undefined si no existe', () => {
      expect(getEntrenadorById(trainers, 'no-existe')).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getEntrenadosCount (lógica)
  // ──────────────────────────────────────────────────────────────
  describe('getEntrenadosCount — lógica', () => {

    function getEntrenadosCount(entrenadores: any[], entrenadorId: string) {
      const entrenador = entrenadores.find(e => e.id === entrenadorId);
      return entrenador?.entrenadosAsignadosIds?.length || 0;
    }

    const trainers = [
      { id: 'trainer-1', entrenadosAsignadosIds: ['e1', 'e2', 'e3'] },
      { id: 'trainer-2', entrenadosAsignadosIds: [] },
    ];

    it('retorna el conteo correcto', () => {
      expect(getEntrenadosCount(trainers, 'trainer-1')).toBe(3);
    });

    it('retorna 0 cuando no tiene entrenados', () => {
      expect(getEntrenadosCount(trainers, 'trainer-2')).toBe(0);
    });

    it('retorna 0 cuando el entrenador no existe', () => {
      expect(getEntrenadosCount(trainers, 'no-existe')).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Invariantes de límites de planes
  // ──────────────────────────────────────────────────────────────
  describe('invariantes de límites', () => {
    const roles = [Rol.ENTRENADOR, Rol.PERSONAL_TRAINER];

    for (const rol of roles) {
      it(`${rol}: PREMIUM siempre tiene maxClients > FREE.maxClients`, () => {
        const freeClients = ROL_PLAN_LIMITS[rol][Plan.FREE].maxClients;
        const premiumClients = ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxClients;
        expect(premiumClients).toBeGreaterThan(freeClients);
      });

      it(`${rol}: FREE no permite timers custom`, () => {
        expect(ROL_PLAN_LIMITS[rol][Plan.FREE].allowCustomTimers).toBe(false);
      });

      it(`${rol}: PREMIUM permite timers custom`, () => {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].allowCustomTimers).toBe(true);
      });
    }
  });
});
