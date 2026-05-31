import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const adminAuthGuard: CanActivateFn = () => {
  const adminAuthService = inject(AdminAuthService);
  const router = inject(Router);

  const isInitialized$ = toObservable(adminAuthService.isInitialized);

  return isInitialized$.pipe(
    filter(isInit => isInit === true),
    take(1),
    map(() => {
      if (adminAuthService.isAdmin()) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
