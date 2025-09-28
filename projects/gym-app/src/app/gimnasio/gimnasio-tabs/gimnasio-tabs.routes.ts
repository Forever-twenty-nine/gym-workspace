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
        path: 'users',
        loadComponent: () =>
          import('../gimnasio-users/gimnasio-users.page').then((m) => m.GimnasioUsersPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../../components/tab2/tab2.page').then((m) => m.Tab2Page), 
      },
      {
        path: 'profile',
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
