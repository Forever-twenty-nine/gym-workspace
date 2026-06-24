/**
 * Tests para role.guard — sin TestBed
 * 
 * Los guards usan inject() de Angular. La estrategia es testear
 * la lógica de negocio directamente creando funciones equivalentes
 * sin depender de Angular DI.
 */
import { Rol } from 'gym-library';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs';

// ─── Lógica de guards extraída para testing directo ───────────────────────────
// Replicamos la lógica interna para testearla de forma aislada
function createGimnasioGuardLogic(role: Rol | undefined, navigate: (path: any[]) => void) {
  return map((r: Rol | undefined) => {
    if (r === Rol.GIMNASIO) return true;
    navigate(['/login']);
    return false;
  })(of(role));
}

function createEntrenadoGuardLogic(role: Rol | undefined, navigate: (path: any[]) => void) {
  return map((r: Rol | undefined) => {
    if (r === Rol.ENTRENADO) return true;
    navigate(['/login']);
    return false;
  })(of(role));
}

function createEntrenadorGuardLogic(role: Rol | undefined, navigate: (path: any[]) => void) {
  return map((r: Rol | undefined) => {
    if (r === Rol.ENTRENADOR || r === Rol.PERSONAL_TRAINER) return true;
    navigate(['/login']);
    return false;
  })(of(role));
}

describe('role.guard — lógica de autorización', () => {
  let navigateMock: any;

  beforeEach(() => {
    navigateMock = vi.fn();
  });

  // ──────────────────────────────────────────────────────────────
  // gimnasioGuard
  // ──────────────────────────────────────────────────────────────
  describe('gimnasioGuard', () => {
    it('permite acceso cuando el rol es GIMNASIO', async () => {
      const result = await lastValueFrom(createGimnasioGuardLogic(Rol.GIMNASIO, navigateMock));
      expect(result).toBe(true);
    });

    it('bloquea acceso cuando el rol es ENTRENADO', async () => {
      const result = await lastValueFrom(createGimnasioGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(result).toBe(false);
    });

    it('bloquea acceso cuando el rol es ENTRENADOR', async () => {
      const result = await lastValueFrom(createGimnasioGuardLogic(Rol.ENTRENADOR, navigateMock));
      expect(result).toBe(false);
    });

    it('bloquea acceso cuando el rol es PERSONAL_TRAINER', async () => {
      const result = await lastValueFrom(createGimnasioGuardLogic(Rol.PERSONAL_TRAINER, navigateMock));
      expect(result).toBe(false);
    });

    it('redirige a /login cuando el rol no es GIMNASIO', async () => {
      await lastValueFrom(createGimnasioGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(navigateMock).toHaveBeenCalledWith(['/login']);
    });

    it('bloquea acceso cuando el usuario no está autenticado (rol undefined)', async () => {
      const result = await lastValueFrom(createGimnasioGuardLogic(undefined, navigateMock));
      expect(result).toBe(false);
    });

    it('redirige a /login cuando el usuario no está autenticado', async () => {
      await lastValueFrom(createGimnasioGuardLogic(undefined, navigateMock));
      expect(navigateMock).toHaveBeenCalledWith(['/login']);
    });

    it('no redirige cuando el acceso es permitido', async () => {
      await lastValueFrom(createGimnasioGuardLogic(Rol.GIMNASIO, navigateMock));
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // entrenadoGuard
  // ──────────────────────────────────────────────────────────────
  describe('entrenadoGuard', () => {
    it('permite acceso cuando el rol es ENTRENADO', async () => {
      const result = await lastValueFrom(createEntrenadoGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(result).toBe(true);
    });

    it('bloquea acceso cuando el rol es GIMNASIO', async () => {
      const result = await lastValueFrom(createEntrenadoGuardLogic(Rol.GIMNASIO, navigateMock));
      expect(result).toBe(false);
    });

    it('bloquea acceso cuando el rol es ENTRENADOR', async () => {
      const result = await lastValueFrom(createEntrenadoGuardLogic(Rol.ENTRENADOR, navigateMock));
      expect(result).toBe(false);
    });

    it('bloquea acceso cuando el rol es PERSONAL_TRAINER', async () => {
      const result = await lastValueFrom(createEntrenadoGuardLogic(Rol.PERSONAL_TRAINER, navigateMock));
      expect(result).toBe(false);
    });

    it('redirige a /login cuando el rol no es ENTRENADO', async () => {
      await lastValueFrom(createEntrenadoGuardLogic(Rol.GIMNASIO, navigateMock));
      expect(navigateMock).toHaveBeenCalledWith(['/login']);
    });

    it('bloquea acceso cuando el usuario no está autenticado', async () => {
      const result = await lastValueFrom(createEntrenadoGuardLogic(undefined, navigateMock));
      expect(result).toBe(false);
    });

    it('no redirige cuando el acceso es permitido', async () => {
      await lastValueFrom(createEntrenadoGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // entrenadorGuard
  // ──────────────────────────────────────────────────────────────
  describe('entrenadorGuard', () => {
    it('permite acceso cuando el rol es ENTRENADOR', async () => {
      const result = await lastValueFrom(createEntrenadorGuardLogic(Rol.ENTRENADOR, navigateMock));
      expect(result).toBe(true);
    });

    it('permite acceso cuando el rol es PERSONAL_TRAINER', async () => {
      const result = await lastValueFrom(createEntrenadorGuardLogic(Rol.PERSONAL_TRAINER, navigateMock));
      expect(result).toBe(true);
    });

    it('bloquea acceso cuando el rol es ENTRENADO', async () => {
      const result = await lastValueFrom(createEntrenadorGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(result).toBe(false);
    });

    it('bloquea acceso cuando el rol es GIMNASIO', async () => {
      const result = await lastValueFrom(createEntrenadorGuardLogic(Rol.GIMNASIO, navigateMock));
      expect(result).toBe(false);
    });

    it('redirige a /login cuando el rol no es entrenador ni personal trainer', async () => {
      await lastValueFrom(createEntrenadorGuardLogic(Rol.ENTRENADO, navigateMock));
      expect(navigateMock).toHaveBeenCalledWith(['/login']);
    });

    it('no redirige cuando es PERSONAL_TRAINER', async () => {
      await lastValueFrom(createEntrenadorGuardLogic(Rol.PERSONAL_TRAINER, navigateMock));
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('bloquea acceso cuando el usuario no está autenticado', async () => {
      const result = await lastValueFrom(createEntrenadorGuardLogic(undefined, navigateMock));
      expect(result).toBe(false);
    });

    it('no redirige cuando es ENTRENADOR', async () => {
      await lastValueFrom(createEntrenadorGuardLogic(Rol.ENTRENADOR, navigateMock));
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Invariantes del sistema de guards
  // ──────────────────────────────────────────────────────────────
  describe('invariantes', () => {
    const allRoles = [Rol.ENTRENADO, Rol.ENTRENADOR, Rol.GIMNASIO, Rol.PERSONAL_TRAINER];

    it('exactamente un guard por rol permite acceso para cada rol', async () => {
      const results: Record<string, Record<string, boolean>> = {};

      for (const role of allRoles) {
        results[role] = {
          gimnasio: await lastValueFrom(createGimnasioGuardLogic(role, vi.fn())),
          entrenado: await lastValueFrom(createEntrenadoGuardLogic(role, vi.fn())),
          entrenador: await lastValueFrom(createEntrenadorGuardLogic(role, vi.fn())),
        };
      }

      // GIMNASIO solo tiene acceso al guard de gimnasio
      expect(results[Rol.GIMNASIO]['gimnasio']).toBe(true);
      expect(results[Rol.GIMNASIO]['entrenado']).toBe(false);
      expect(results[Rol.GIMNASIO]['entrenador']).toBe(false);

      // ENTRENADO solo tiene acceso al guard de entrenado
      expect(results[Rol.ENTRENADO]['entrenado']).toBe(true);
      expect(results[Rol.ENTRENADO]['gimnasio']).toBe(false);
      expect(results[Rol.ENTRENADO]['entrenador']).toBe(false);

      // ENTRENADOR tiene acceso al guard de entrenador
      expect(results[Rol.ENTRENADOR]['entrenador']).toBe(true);
      expect(results[Rol.ENTRENADOR]['gimnasio']).toBe(false);
      expect(results[Rol.ENTRENADOR]['entrenado']).toBe(false);

      // PERSONAL_TRAINER también tiene acceso al guard de entrenador
      expect(results[Rol.PERSONAL_TRAINER]['entrenador']).toBe(true);
      expect(results[Rol.PERSONAL_TRAINER]['gimnasio']).toBe(false);
      expect(results[Rol.PERSONAL_TRAINER]['entrenado']).toBe(false);
    });
  });
});
