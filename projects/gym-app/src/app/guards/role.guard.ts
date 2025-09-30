import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'gym-library';

function getCurrentUserRole(): string | null {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  return user?.role || null;
}

export const gimnasioGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  if (role === 'gimnasio') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const clienteGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  if (role === 'cliente') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const entrenadorGuard = (): boolean => {
  const router = inject(Router);
  const role = getCurrentUserRole();
  if (role === 'entrenador') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
