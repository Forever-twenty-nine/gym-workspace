import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../core/services/user.service';


export const gimnasioGuard = (): boolean => {
  const userService = inject(UserService);
  const router = inject(Router);
  const role = userService.getMainRole();
  if (role === 'gimnasio') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const clienteGuard = (): boolean => {
  const userService = inject(UserService);
  const router = inject(Router);
  const role = userService.getMainRole();
  if (role === 'cliente') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const entrenadorGuard = (): boolean => {
  const userService = inject(UserService);
  const router = inject(Router);
  const role = userService.getMainRole();
  if (role === 'entrenador') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
