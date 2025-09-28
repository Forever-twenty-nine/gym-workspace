import { Routes } from '@angular/router';
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
        path: 'clientes',
        loadComponent: () =>
          import('../../components/tab2/tab2.page').then((m) => m.Tab2Page), // Reutilizamos tab2 como clientes
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../../components/tab3/tab3.page').then((m) => m.Tab3Page), // Reutilizamos tab3 como perfil
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
