import { Routes } from '@angular/router';
import { EntrenadoresPage } from './pages/entrenadores/entrenadores.page';
import { EntrenadosPage } from './pages/entrenados/entrenados.page';
import { GimnasiosPage } from './pages/gimnasios/gimnasios.page';
import { UsuariosPage } from './pages/usuarios/usuarios.page';

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
    path: 'gimnasios',
    component: GimnasiosPage
  },
  {
    path: '',
    redirectTo: '/usuarios',
    pathMatch: 'full'
  }
];
