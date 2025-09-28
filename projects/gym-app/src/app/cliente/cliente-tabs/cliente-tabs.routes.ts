import { Routes } from '@angular/router';
import { ClienteTabsPage } from './cliente-tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: ClienteTabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'entrenamientos',
        loadComponent: () =>
          import('../entrenamientos/entrenamientos.page').then((m) => m.EntrenamientosPage),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../../components/tab3/tab3.page').then((m) => m.Tab3Page), 
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
