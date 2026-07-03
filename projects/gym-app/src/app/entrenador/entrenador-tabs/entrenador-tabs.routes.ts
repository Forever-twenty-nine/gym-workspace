import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { EntrenadorTabsPage } from './entrenador-tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: EntrenadorTabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('../agenda/agenda.page').then((m) => m.AgendaPage),
      },
      {
        path: 'creaciones',
        loadComponent: () =>
          import('../creaciones/creaciones.page').then((m) => m.CreacionesPage),
      },
      {
        path: 'entrenados',
        redirectTo: () => {
          const router = inject(Router);
          return router.createUrlTree(['/entrenador-tabs/creaciones'], { queryParams: { tab: 'entrenados' } });
        }
      },
      {
        path: 'rutinas',
        redirectTo: () => {
          const router = inject(Router);
          return router.createUrlTree(['/entrenador-tabs/creaciones'], { queryParams: { tab: 'rutinas' } });
        }
      },
      {
        path: 'ejercicios',
        redirectTo: () => {
          const router = inject(Router);
          return router.createUrlTree(['/entrenador-tabs/creaciones'], { queryParams: { tab: 'ejercicios' } });
        }
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../../shared/perfil/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
