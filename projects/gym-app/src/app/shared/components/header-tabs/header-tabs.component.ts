import { Component, inject, computed } from '@angular/core';
import { IonHeader, IonToolbar,  IonMenuButton, IonButtons, IonIcon, IonBadge, MenuController, IonButton, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { InvitacionService } from '../../../core/services/invitacion.service';
import { MensajesGlobalesService } from '../../../core/services/mensajes-globales.service';
import { MensajeService } from '../../../core/services/mensaje.service';
import { ChatListModalComponent } from '../../../entrenado/social/components/chat/chat-list-modal/chat-list-modal.component';
import { Rol } from 'gym-library';

@Component({
  selector: 'app-header-tabs',
  standalone: true,
  imports: [ IonHeader, IonToolbar, IonMenuButton, IonButtons, IonIcon, IonBadge, IonButton ],
  templateUrl: './header-tabs.component.html'
})
export class HeaderTabsComponent {
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);
  private mensajesGlobalesService = inject(MensajesGlobalesService);
  private mensajeService = inject(MensajeService);
  private menuCtrl = inject(MenuController);
  private modalCtrl = inject(ModalController);

  currentUser = this.authService.currentUser;

  unreadChatsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mensajeService.getContadorNoLeidos(user.uid)();
  });

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
  });

  constructor() {
    addIcons({ notificationsOutline, chatbubblesOutline });
  }

  openNotifications() {
    this.menuCtrl.open('notifications-menu');
  }

  async openChatList() {
    const modal = await this.modalCtrl.create({
      component: ChatListModalComponent,
      cssClass: 'premium-modal'
    });
    await modal.present();
  }
}

