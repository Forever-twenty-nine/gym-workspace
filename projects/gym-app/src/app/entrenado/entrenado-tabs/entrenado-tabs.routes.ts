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
        path: 'social',
        loadComponent: () =>
          import('../social/social.page').then((m) => m.SocialPage),
      },
      {
        path: 'progreso',
        loadComponent: () =>
          import('../progreso/progreso.page').then((m) => m.ProgresoPage),
      },
      {
        path: 'ejercicios',
        loadComponent: () =>
          import('../ejercicios-premium/ejercicios-premium.page').then((m) => m.EjerciciosPremiumPage),
      },
      {
        path: 'mis-rutinas',
        loadComponent: () =>
          import('../rutinas-premium/rutinas-premium.page').then((m) => m.RutinasPremiumPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  }
];
