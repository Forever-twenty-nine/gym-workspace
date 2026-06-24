import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from 'gym-library';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take, switchMap } from 'rxjs';
import { of } from 'rxjs';

/**
 * Función auxiliar para esperar a que el estado de autenticación termine de cargar.
 * Devuelve un observable con el rol del usuario una vez que isLoading es false.
 */
function waitForInitialization() {
  const authService = inject(AuthService);

  // Solución crítica: Si el estado de Firebase YA está cargado, no creamos
  // un efecto de Signal, directamente devolvemos el rol. Si no, en una
  // navegación interna al vuelo Angular choca y se bloquea silenciosamente.
  if (!authService.isLoading()) {
    return of(authService.currentUser());
  }

  return toObservable(authService.isLoading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => authService.currentUser())
  );
}

export const gimnasioGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(user => {
      if (user && !user.onboarded) {
        console.warn('⚠️ RoleGuard: Usuario no completó onboarding, redirigiendo a /onboarding');
        router.navigate(['/onboarding']);
        return false;
      }
      if (user?.role === Rol.GIMNASIO) return true;
      console.warn('⚠️ RoleGuard: Usuario no es GIMNASIO, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};

export const entrenadoGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(user => {
      if (user && !user.onboarded) {
        console.warn('⚠️ RoleGuard: Usuario no completó onboarding, redirigiendo a /onboarding');
        router.navigate(['/onboarding']);
        return false;
      }
      if (user?.role === Rol.ENTRENADO) return true;
      console.warn('⚠️ RoleGuard: Usuario no es ENTRENADO, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};

export const entrenadorGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(user => {
      if (user && !user.onboarded) {
        console.warn('⚠️ RoleGuard: Usuario no completó onboarding, redirigiendo a /onboarding');
        router.navigate(['/onboarding']);
        return false;
      }
      if (user?.role === Rol.ENTRENADOR || user?.role === Rol.PERSONAL_TRAINER) return true;
      console.warn('⚠️ RoleGuard: Usuario no es ENTRENADOR, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};
export const publicGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(user => {
      if (!user) {
        return true;
      }

      console.warn('⚠️ RoleGuard (publicGuard): Usuario ya autenticado, redirigiendo...');
      if (!user.onboarded) {
        router.navigate(['/onboarding']);
        return false;
      }

      switch (user.role) {
        case Rol.ENTRENADO:
          router.navigate(['/entrenado-tabs']);
          break;
        case Rol.ENTRENADOR:
        case Rol.PERSONAL_TRAINER:
          router.navigate(['/entrenador-tabs']);
          break;
        case Rol.GIMNASIO:
          router.navigate(['/gimnasio-tabs']);
          break;
        default:
          router.navigate(['/onboarding']);
      }
      return false;
    })
  );
};

