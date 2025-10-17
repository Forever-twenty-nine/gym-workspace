import { Routes } from '@angular/router';
import { EntrenadoresPage } from './pages/entrenadores/entrenadores.page';
import { EntrenadosPage } from './pages/entrenados/entrenados.page';
import { GimnasiosPage } from './pages/gimnasios/gimnasios.page';
import { UsuariosPage } from './pages/usuarios/usuarios.page';
import { EntrenadorDetail } from './pages/entrenadores/entrenador-detail/entrenador-detail';
import { EntrenadoDetail } from './pages/entrenados/entrenado-detail/entrenado-detail';

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
    path: 'entrenadores/:id',
    component: EntrenadorDetail
  },
  {
    path: 'entrenados',
    component: EntrenadosPage
  },
  {
    path: 'entrenados/:id',
    component: EntrenadoDetail
  },
  {
    path: 'gimnasios',
    component: GimnasiosPage
  },
  {
    path: '',
    redirectTo: '/usuarios',
    pathMatch: 'full'
  }
];
