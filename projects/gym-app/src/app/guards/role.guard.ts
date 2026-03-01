import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from 'gym-library';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take, switchMap } from 'rxjs';

/**
 * Función auxiliar para esperar a que el estado de autenticación termine de cargar.
 * Devuelve un observable con el rol del usuario una vez que isLoading es false.
 */
function waitForInitialization() {
  const authService = inject(AuthService);

  return toObservable(authService.isLoading).pipe(
    // Solo dejamos pasar cuando isLoading == false (Firebase terminó de chequear)
    filter(loading => !loading),
    take(1),
    map(() => authService.currentUser()?.role)
  );
}

export const gimnasioGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(role => {
      if (role === Rol.GIMNASIO) return true;
      console.warn('⚠️ RoleGuard: Usuario no es GIMNASIO, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};

export const entrenadoGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(role => {
      if (role === Rol.ENTRENADO) return true;
      console.warn('⚠️ RoleGuard: Usuario no es ENTRENADO, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};

export const entrenadorGuard = () => {
  const router = inject(Router);
  return waitForInitialization().pipe(
    map(role => {
      if (role === Rol.ENTRENADOR || role === Rol.PERSONAL_TRAINER) return true;
      console.warn('⚠️ RoleGuard: Usuario no es ENTRENADOR, redirigiendo a login');
      router.navigate(['/login']);
      return false;
    })
  );
};
