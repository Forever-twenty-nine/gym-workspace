import { Component, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { IonHeader, IonToolbar, IonAvatar, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { InvitacionService } from '../../../core/services/invitacion.service';
import { Rol } from 'gym-library';

@Component({
  selector: 'app-header-tabs',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonAvatar, IonButton, IonIcon, IonBadge, NgOptimizedImage],
  templateUrl: './header-tabs.component.html',
  styleUrls: ['./header-tabs.component.css']
})
export class HeaderTabsComponent {
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);

  currentUser = this.authService.currentUser;

  notificacionesCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    
    if (user.role === Rol.ENTRENADOR || user.role === Rol.PERSONAL_TRAINER) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)().length;
    } else if (user.role === Rol.ENTRENADO) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenado(user.uid)().length;
    }
    
    // Para GN u otros puede implementarse otra lógica luego
    return 0;
  });

  constructor() {
    addIcons({ notificationsOutline });
  }
}
