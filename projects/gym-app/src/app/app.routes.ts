import { Routes } from '@angular/router';
import { entrenadoGuard, entrenadorGuard, gimnasioGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadComponent: () => import('./auth/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./auth/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: 'test-onboarding',
    loadComponent: () => import('./auth/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: 'gimnasio-tabs',
    loadChildren: () => import('./gimnasio/gimnasio-tabs/gimnasio-tabs.routes').then((m) => m.routes),
    canActivate: [gimnasioGuard]
  },
  {
    path: 'entrenado-tabs',
    loadChildren: () => import('./entrenado/entrenado-tabs/entrenado-tabs.routes').then((m) => m.routes),
    canActivate: [entrenadoGuard]
  },
  {
    path: 'entrenador-tabs',
    loadChildren: () => import('./entrenador/entrenador-tabs/entrenador-tabs.routes').then((m) => m.routes),
    canActivate: [entrenadorGuard]
  }
];
