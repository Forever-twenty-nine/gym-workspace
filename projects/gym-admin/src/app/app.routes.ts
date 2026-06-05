import { Routes } from '@angular/router';
import { EntrenadoresPage } from './pages/entrenadores/entrenadores.page';
import { EntrenadosPage } from './pages/entrenados/entrenados.page';
import { GimnasiosPage } from './pages/gimnasios/gimnasios.page';
import { UsuariosPage } from './pages/usuarios/usuarios.page';
import { SolicitudesPlanPage } from './pages/solicitudes-plan/solicitudes-plan.page';
import { ConvocatoriasPage } from './pages/convocatorias/convocatorias.page';
import { InvitacionesPage } from './pages/invitaciones/invitaciones.page';
import { EjerciciosPage } from './pages/ejercicios/ejercicios.page';
import { RutinasPage } from './pages/rutinas/rutinas.page';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(c => c.LoginPage)
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    children: [
      {
        path: 'usuarios',
        component: UsuariosPage
      },
      {
        path: 'entrenadores',
        component: EntrenadoresPage
      },
      {
        path: 'entrenados',
        component: EntrenadosPage
      },
      {
        path: 'ejercicios',
        component: EjerciciosPage
      },
      {
        path: 'rutinas',
        component: RutinasPage
      },
      {
        path: 'gimnasios',
        component: GimnasiosPage
      },
      {
        path: 'solicitudes-plan',
        component: SolicitudesPlanPage
      },
      {
        path: 'convocatorias',
        component: ConvocatoriasPage
      },
      {
        path: 'invitaciones',
        component: InvitacionesPage
      },
      {
        path: 'mensajes-globales',
        loadComponent: () => import('./pages/mensajes-globales/mensajes-globales').then(c => c.MensajesGlobalesComponent)
      },
      {
        path: 'social',
        loadComponent: () => import('./pages/social/social.page').then(c => c.SocialPage)
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
      }
    ]
  }
];
