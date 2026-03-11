import { Component, inject, computed } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonMenuButton, IonButtons, IonIcon, IonBadge, MenuController, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { InvitacionService } from '../../../core/services/invitacion.service';
import { MensajesGlobalesService } from '../../../core/services/mensajes-globales.service';
import { Rol } from 'gym-library';

@Component({
  selector: 'app-header-tabs',
  standalone: true,
  imports: [IonTitle, IonHeader, IonToolbar, IonMenuButton, IonButtons, IonIcon, IonBadge, IonButton],
  templateUrl: './header-tabs.component.html'
})
export class HeaderTabsComponent {
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);
  private mensajesGlobalesService = inject(MensajesGlobalesService);
  private menuCtrl = inject(MenuController);

  currentUser = this.authService.currentUser;

  notificacionesCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    let count = 0;
    count += this.mensajesGlobalesService.mensajesNoLeidos().length;

    if (user.role === Rol.ENTRENADOR || user.role === Rol.PERSONAL_TRAINER) {
      count += this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)().length;
    } else if (user.role === Rol.ENTRENADO) {
      count += this.invitacionService.getInvitacionesPendientesPorEntrenado(user.uid)().length;
    }

    return count;
    // Para GN u otros puede implementarse otra lógica luego
  });

  constructor() {
    addIcons({ notificationsOutline });
  }

  openNotifications() {
    this.menuCtrl.open('notifications-menu');
  }
}

