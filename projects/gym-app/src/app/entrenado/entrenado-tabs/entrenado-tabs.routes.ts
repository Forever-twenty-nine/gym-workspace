import { Routes } from '@angular/router';
import { EntrenadoTabsPage } from './entrenado-tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: EntrenadoTabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'rutinas',
        loadComponent: () =>
          import('../entrenamientos/entrenamientos.page').then((m) => m.EntrenamientosPage),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../perfil/perfil.page').then((m) => m.PerfilPage), 
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
