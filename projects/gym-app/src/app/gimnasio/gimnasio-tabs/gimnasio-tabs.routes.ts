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
        path: 'agenda',
        loadComponent: () =>
          import('../gimnasio-agenda/agenda.page').then((m) => m.AgendaPage),
      },
      {
        path: 'entrenadores',
        loadComponent: () =>
          import('../gimnasio-entrenadores/gimnasio-entrenadores.page').then((m) => m.GimnasioEntrenadoresPage),
      },
      {
        path: 'entrenados',
        loadComponent: () =>
          import('../gimnasio-entrenados/gimnasio-entrenados.page').then((m) => m.GimnasioEntrenadosPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
