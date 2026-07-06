import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { PerfilUserHeaderComponent } from './components/perfil-user-header/perfil-user-header';
import { User, Entrenado, Entrenador, Gimnasio } from 'gym-library';
import { Plan } from 'gym-library';
import { PerfilUserBodyComponent } from './components/perfil-user-body/perfil-user-body';
import { ProfileHead } from '../../../core/interfaces/profile-head.interface';

@Component({
  selector: 'app-perfil-tab-info',
  imports: [PerfilUserHeaderComponent, PerfilUserBodyComponent],
  templateUrl: './perfil-tab-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabInfoComponent {

  user = input.required<User>();

  /** Datos secundarios por rol. El padre resuelve los que correspondan. */
  entrenadoData = input<Entrenado | null>(null);
  entrenadorData = input<Entrenador | null>(null);
  gimnasioData = input<Gimnasio | null>(null);

  // header data
  userProfileHead = computed<ProfileHead>(() => {
    const username = this.user().nombre || 'usuario sin nombre';
    const photoURL = this.user().photoURL || null;
    const userRole = this.user().role as string || 'usuario sin rol';
    return { username, photoURL, userRole };
  });

  isPremium = computed(() => this.user().plan === Plan.PREMIUM);

  logoutClick = output<void>();
}
