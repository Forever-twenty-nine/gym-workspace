import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { PerfilUserHeaderComponent } from './components/perfil-user-header/perfil-user-header';
import { User, Entrenado } from 'gym-library';
import { Plan } from 'gym-library';
import { PerfilUserBodyComponent } from "./components/perfil-user-body/perfil-user-body";

@Component({
  selector: 'app-perfil-tab-info',
  imports: [PerfilUserHeaderComponent, PerfilUserBodyComponent],
  templateUrl: './perfil-tab-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabInfoComponent {

  user = input.required<User>();

  currentEntrenado = input<Entrenado | null>();

  userName = computed(() => {
    const nombre = this.user().nombre;
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  });

  photoURL = computed(() => {
    const photoURL = this.user().photoURL;
    if (!photoURL) return null;
    return photoURL;
  });

  roleDisplayName = computed(() => {
    const role = this.user().role as string;
    switch (role) {
      case 'gimnasio': return '';
      case 'entrenado': return 'Entrenado';
      case 'entrenador': return 'Entrenador';
      case 'user': return 'Usuario';
      default: return 'Usuario';
    }
  });

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  editClick = output<void>();
  logoutClick = output<void>();
}