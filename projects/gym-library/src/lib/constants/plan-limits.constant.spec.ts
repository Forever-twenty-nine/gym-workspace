import { ROL_PLAN_LIMITS, PlanLimits } from './plan-limits.constant';
import { Rol } from '../enums/rol.enum';
import { Plan } from '../enums/plan.enum';

describe('ROL_PLAN_LIMITS', () => {
  const roles = [Rol.ENTRENADOR, Rol.PERSONAL_TRAINER, Rol.GIMNASIO, Rol.ENTRENADO];
  const planes = [Plan.FREE, Plan.PREMIUM];

  // ──────────────────────────────────────────────────────────────
  // Estructura: todos los roles y planes existen
  // ──────────────────────────────────────────────────────────────
  describe('estructura', () => {
    it('define límites para todos los roles', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol]).toBeDefined();
      }
    });

    it('cada rol tiene definidos los dos planes (FREE y PREMIUM)', () => {
      for (const rol of roles) {
        for (const plan of planes) {
          expect(ROL_PLAN_LIMITS[rol][plan]).toBeDefined();
        }
      }
    });

    it('cada límite tiene todas las propiedades requeridas', () => {
      for (const rol of roles) {
        for (const plan of planes) {
          const limits: PlanLimits = ROL_PLAN_LIMITS[rol][plan];
          expect(typeof limits.maxClients).toBe('number');
          expect(typeof limits.maxRoutines).toBe('number');
          expect(typeof limits.maxExercises).toBe('number');
          expect(typeof limits.allowCustomTimers).toBe('boolean');
          expect(typeof limits.allowCustomDuration).toBe('boolean');
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Plan PREMIUM: ilimitado en todos los roles
  // ──────────────────────────────────────────────────────────────
  describe('plan PREMIUM', () => {
    it('todos los roles tienen Infinity en maxClients con plan PREMIUM', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxClients).toBe(Infinity);
      }
    });

    it('todos los roles tienen Infinity en maxRoutines con plan PREMIUM', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxRoutines).toBe(Infinity);
      }
    });

    it('todos los roles tienen Infinity en maxExercises con plan PREMIUM', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxExercises).toBe(Infinity);
      }
    });

    it('todos los roles tienen allowCustomTimers = true con plan PREMIUM', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].allowCustomTimers).toBe(true);
      }
    });

    it('todos los roles tienen allowCustomDuration = true con plan PREMIUM', () => {
      for (const rol of roles) {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].allowCustomDuration).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Plan FREE: límites específicos por rol
  // ──────────────────────────────────────────────────────────────
  describe('ENTRENADOR - plan FREE', () => {
    const limits = ROL_PLAN_LIMITS[Rol.ENTRENADOR][Plan.FREE];

    it('maxClients = 3', () => expect(limits.maxClients).toBe(3));
    it('maxRoutines = 3', () => expect(limits.maxRoutines).toBe(3));
    it('maxExercises = 10', () => expect(limits.maxExercises).toBe(10));
    it('allowCustomTimers = false', () => expect(limits.allowCustomTimers).toBe(false));
    it('allowCustomDuration = false', () => expect(limits.allowCustomDuration).toBe(false));
  });

  describe('PERSONAL_TRAINER - plan FREE', () => {
    const limits = ROL_PLAN_LIMITS[Rol.PERSONAL_TRAINER][Plan.FREE];

    it('maxClients = 3 (igual a ENTRENADOR)', () => expect(limits.maxClients).toBe(3));
    it('maxRoutines = 3', () => expect(limits.maxRoutines).toBe(3));
    it('maxExercises = 10', () => expect(limits.maxExercises).toBe(10));
    it('allowCustomTimers = false', () => expect(limits.allowCustomTimers).toBe(false));
    it('allowCustomDuration = false', () => expect(limits.allowCustomDuration).toBe(false));
  });

  describe('GIMNASIO - plan FREE', () => {
    const limits = ROL_PLAN_LIMITS[Rol.GIMNASIO][Plan.FREE];

    it('maxClients = 20 (más generoso que entrenador)', () => expect(limits.maxClients).toBe(20));
    it('maxRoutines = 10', () => expect(limits.maxRoutines).toBe(10));
    it('maxExercises = 30', () => expect(limits.maxExercises).toBe(30));
    it('allowCustomTimers = true (el gimnasio lo tiene habilitado en free)', () => {
      expect(limits.allowCustomTimers).toBe(true);
    });
    it('allowCustomDuration = true', () => expect(limits.allowCustomDuration).toBe(true));
  });

  describe('ENTRENADO - plan FREE', () => {
    const limits = ROL_PLAN_LIMITS[Rol.ENTRENADO][Plan.FREE];

    it('maxRoutines = 1', () => expect(limits.maxRoutines).toBe(1));
    it('maxExercises = 5', () => expect(limits.maxExercises).toBe(5));
    it('allowCustomTimers = false', () => expect(limits.allowCustomTimers).toBe(false));
  });

  // ──────────────────────────────────────────────────────────────
  // Lógica: PREMIUM siempre es más permisivo que FREE
  // ──────────────────────────────────────────────────────────────
  describe('invariante: PREMIUM >= FREE en todos los límites numéricos', () => {
    for (const rol of roles) {
      it(`${rol}: PREMIUM.maxClients >= FREE.maxClients`, () => {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxClients).toBeGreaterThanOrEqual(
          ROL_PLAN_LIMITS[rol][Plan.FREE].maxClients
        );
      });

      it(`${rol}: PREMIUM.maxRoutines >= FREE.maxRoutines`, () => {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxRoutines).toBeGreaterThanOrEqual(
          ROL_PLAN_LIMITS[rol][Plan.FREE].maxRoutines
        );
      });

      it(`${rol}: PREMIUM.maxExercises >= FREE.maxExercises`, () => {
        expect(ROL_PLAN_LIMITS[rol][Plan.PREMIUM].maxExercises).toBeGreaterThanOrEqual(
          ROL_PLAN_LIMITS[rol][Plan.FREE].maxExercises
        );
      });
    }
  });
});
