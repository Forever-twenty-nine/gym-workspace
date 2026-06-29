import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { PerfilUserHeaderComponent } from './components/perfil-user-header/perfil-user-header';
import { User, Entrenado } from 'gym-library';
import {ProfileHead} from '../../../core/interfaces/profile-head.interface';
import {ProfileBody} from '../../../core/interfaces/profile-body.interface';
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


  // header data
  userProfileHead = computed<ProfileHead>(() => {
    const username = this.user().nombre || 'usuario sin nombre';
    const photoURL = this.user().photoURL || null;
    const userRole = this.user().role as string || 'usuario sin rol'; 
    return { username, photoURL, userRole };
  });

  // body data
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