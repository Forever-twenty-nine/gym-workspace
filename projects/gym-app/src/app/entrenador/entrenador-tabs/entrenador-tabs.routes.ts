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
        path: 'entrenados',
        loadComponent: () =>
          import('../entrenados/entrenados.page').then((m) => m.EntrenadosPage),
      },
      {
        path: 'rutinas',
        loadComponent: () =>
          import('../rutinas/rutinas.page').then((m) => m.RutinasPage),
      },
      
      {
        path: 'ejercicios',
        loadComponent: () =>
          import('../ejercicios/ejercicios.page').then((m) => m.EjerciciosPage),
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
