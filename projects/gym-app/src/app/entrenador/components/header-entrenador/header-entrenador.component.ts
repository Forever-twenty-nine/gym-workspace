import { Component, inject, computed } from '@angular/core';
import { IonHeader, IonToolbar, IonAvatar, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { InvitacionService } from '../../../core/services/invitacion.service';

@Component({
  selector: 'app-header-entrenador',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonAvatar, IonButton, IonIcon, IonBadge],
  templateUrl: './header-entrenador.component.html',
  styleUrls: ['./header-entrenador.component.css']
})
export class HeaderEntrenadorComponent {
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);

  currentUser = this.authService.currentUser;

  invitacionesPendientesCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)().length;
  });

  constructor() {
    addIcons({ notificationsOutline });
  }
}
