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
          import('../rutinas/rutinas.page').then((m) => m.RutinasPage),
      },
      {
        path: 'progreso',
        loadComponent: () =>
          import('../progreso/progreso.page').then((m) => m.ProgresoPage),
      },
      {
        path: 'rutina-progreso/:rutinaId',
        loadComponent: () =>
          import('../rutina-progreso/rutina-progreso.page').then((m) => m.RutinaProgresoPage),
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
