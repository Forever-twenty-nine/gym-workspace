import { Routes } from '@angular/router';
import { GimnasioTabsPage } from './gimnasio-tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: GimnasioTabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../gimnasio-dashboard/gimnasio-dashboard.page').then((m) => m.GimnasioDashboardPage),
      },
      {
        path: 'entrenadores',
        loadComponent: () =>
          import('../gimnasio-users/gimnasio-users.page').then((m) => m.GimnasioUsersPage),
        data: { roleFilter: 'entrenador' }
      },
      {
        path: 'entrenados',
        loadComponent: () =>
          import('../gimnasio-users/gimnasio-users.page').then((m) => m.GimnasioUsersPage),
        data: { roleFilter: 'entrenado' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
