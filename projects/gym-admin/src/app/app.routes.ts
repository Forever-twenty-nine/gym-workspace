
import { Routes } from '@angular/router';
import { EntrenadoresPage } from './pages/entrenadores/entrenadores.page';
import { EntrenadosPage } from './pages/entrenados/entrenados.page';
import { GimnasiosPage } from './pages/gimnasios/gimnasios.page';
import { UsuariosPage } from './pages/usuarios/usuarios.page';
import { SolicitudesPlanPage } from './pages/solicitudes-plan/solicitudes-plan.page';
import { EjerciciosPage } from './pages/ejercicios/ejercicios.page';
import { RutinasPage } from './pages/rutinas/rutinas.page';
import { RutinasAsignadasPage } from './pages/rutinas-asignadas/rutinas-asignadas.page';
import { SesionesRutinasPage } from './pages/sesiones-rutinas/sesiones-rutinas.page';

export const routes: Routes = [
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
    path: 'rutinas-asignadas',
    component: RutinasAsignadasPage
  },
  {
    path: 'sesiones-rutina',
    component: SesionesRutinasPage
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
    path: 'mensajes-globales',
    loadComponent: () => import('./pages/mensajes-globales/mensajes-globales').then(c => c.MensajesGlobalesComponent)
  },
  {
    path: '',
    redirectTo: '/usuarios',
    pathMatch: 'full'
  }
];
