import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'gym-library';
import { Rol } from 'gym-library';

function getCurrentUserRole(): string | undefined {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  return user?.role;
}

export const gimnasioGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  
  if (role === Rol.GIMNASIO) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

export const entrenadoGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  
  if (role === Rol.ENTRENADO) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

export const entrenadorGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  
  if (role === Rol.ENTRENADOR || role === Rol.PERSONAL_TRAINER) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
