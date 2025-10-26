import { Rol } from './rol.enum';

describe('Rol Enum', () => {
  describe('Valores del enum', () => {
    it('debe tener el valor correcto para ENTRENADO', () => {
      expect(Rol.ENTRENADO).toBe('entrenado');
    });

    it('debe tener el valor correcto para ENTRENADOR', () => {
      expect(Rol.ENTRENADOR).toBe('entrenador');
    });

    it('debe tener el valor correcto para GIMNASIO', () => {
      expect(Rol.GIMNASIO).toBe('gimnasio');
    });

    it('debe tener el valor correcto para PERSONAL_TRAINER', () => {
      expect(Rol.PERSONAL_TRAINER).toBe('personal_trainer');
    });
  });

  describe('Estructura del enum', () => {
    it('debe contener todos los roles esperados', () => {
      const expectedRoles = ['entrenado', 'entrenador', 'gimnasio', 'personal_trainer'];
      const actualRoles = Object.values(Rol);

      expect(actualRoles).toEqual(expectedRoles);
      expect(actualRoles).toHaveLength(4);
    });

    it('debe tener las claves correctas', () => {
      const expectedKeys = ['ENTRENADO', 'ENTRENADOR', 'GIMNASIO', 'PERSONAL_TRAINER'];
      const actualKeys = Object.keys(Rol);

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys).toHaveLength(4);
    });
  });

  describe('Tipo de valores', () => {
    it('todos los valores deben ser strings', () => {
      Object.values(Rol).forEach(value => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('debe poder acceder por clave', () => {
      expect(Rol['ENTRENADO']).toBe('entrenado');
      expect(Rol['ENTRENADOR']).toBe('entrenador');
    });
  });

  describe('Utilidades del enum', () => {
    it('debe poder verificar si un valor es válido', () => {
      expect(Object.values(Rol)).toContain('entrenado');
      expect(Object.values(Rol)).toContain('entrenador');
      expect(Object.values(Rol)).not.toContain('admin');
      expect(Object.values(Rol)).not.toContain('');
    });

    it('debe poder obtener todas las opciones disponibles', () => {
      const roles = Object.values(Rol);
      expect(roles).toEqual(['entrenado', 'entrenador', 'gimnasio', 'personal_trainer']);
    });
  });
});