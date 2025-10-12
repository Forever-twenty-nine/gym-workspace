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
