import { Plan } from './plan.enum';

describe('Plan Enum', () => {
  describe('Valores del enum', () => {
    it('debe tener el valor correcto para FREE', () => {
      expect(Plan.FREE).toBe('free');
    });

    it('debe tener el valor correcto para PREMIUM', () => {
      expect(Plan.PREMIUM).toBe('premium');
    });
  });

  describe('Estructura del enum', () => {
    it('debe contener los planes esperados', () => {
      const expectedPlans = ['free', 'premium'];
      const actualPlans = Object.values(Plan);

      expect(actualPlans).toEqual(expectedPlans);
      expect(actualPlans).toHaveLength(2);
    });

    it('debe tener las claves correctas', () => {
      const expectedKeys = ['FREE', 'PREMIUM'];
      const actualKeys = Object.keys(Plan);

      expect(actualKeys).toEqual(expectedKeys);
    });
  });

  describe('Validaciones de negocio', () => {
    it('debe tener exactamente 2 planes disponibles', () => {
      expect(Object.keys(Plan)).toHaveLength(2);
    });

    it('FREE debe ser el plan básico', () => {
      expect(Plan.FREE).toBe('free');
    });

    it('PREMIUM debe ser el plan avanzado', () => {
      expect(Plan.PREMIUM).toBe('premium');
    });
  });

  describe('Funciones helper (ejemplo)', () => {
    const isPremium = (plan: Plan): boolean => plan === Plan.PREMIUM;
    const isFree = (plan: Plan): boolean => plan === Plan.FREE;

    it('debe identificar correctamente planes premium', () => {
      expect(isPremium(Plan.PREMIUM)).toBe(true);
      expect(isPremium(Plan.FREE)).toBe(false);
    });

    it('debe identificar correctamente planes free', () => {
      expect(isFree(Plan.FREE)).toBe(true);
      expect(isFree(Plan.PREMIUM)).toBe(false);
    });
  });
});