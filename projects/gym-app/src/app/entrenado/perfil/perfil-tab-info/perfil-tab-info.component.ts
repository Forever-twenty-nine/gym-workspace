import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { PerfilUserHeaderComponent } from './components/perfil-user-header/perfil-user-header.component';
import { User as LibraryUser, Entrenado, Plan } from 'gym-library';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-perfil-tab-info',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    PerfilUserHeaderComponent
],
  templateUrl: './perfil-tab-info.component.html',
  styles: [`
    .initials-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--ion-color-light);
      color: var(--ion-color-medium);
      font-weight: 600;
      font-size: 1.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilTabInfoComponent {
  user = input.required<User>();
  currentEntrenado = input<Entrenado | null>();

  initials = computed(() => {
    const nombre = this.user().nombre;
    if (!nombre) return 'U';
    return nombre.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').substring(0, 2);
  });

  roleDisplayName = computed(() => {
    const role = this.user().role as string;
    switch (role) {
      case 'gimnasio': return 'Gimnasio';
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