import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenu, IonList, IonItem, IonLabel, ModalController, IonIcon, IonButton, IonItemDivider, IonNote, ToastController, IonBadge, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, personAddOutline, fitnessOutline, informationCircleOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from '../../../../../core/services/auth.service';
import { MensajesGlobalesService } from '../../../../../core/services/mensajes-globales.service';
import { InvitacionService } from '../../../../../core/services/invitacion.service';
import { MensajeService } from '../../../../../core/services/mensaje.service';
import { MensajeGlobalModalComponent } from './mensaje-global-modal/mensaje-global-modal.component';
import { ChatListModalComponent } from '../../../../../entrenado/social/components/chat/chat-list-modal/chat-list-modal.component';
import { Rol } from 'gym-library';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonMenu,
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon, 
    IonButton, 
    IonItemDivider,
    IonBadge
  ],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit {
  private authService = inject(AuthService);
  private mensajesGlobalesService = inject(MensajesGlobalesService);
  private invitacionService = inject(InvitacionService);
  private mensajeService = inject(MensajeService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private menuCtrl = inject(MenuController);

  currentUser = this.authService.currentUser;

  unreadChatsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mensajeService.getContadorNoLeidos(user.uid)();
  });

  canUseChat = computed(() => {
    const user = this.currentUser();
    return user && user.role !== 'gimnasio';
  });
  
  mensajesNoLeidos = this.mensajesGlobalesService.mensajesNoLeidos;
  mensajesLeidos = this.mensajesGlobalesService.mensajesLeidos;

  invitacionesPendientes = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (user.role === Rol.ENTRENADOR || user.role === Rol.PERSONAL_TRAINER) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)();
    } else if (user.role === Rol.ENTRENADO) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenado(user.uid)();
    }
    return [];
  });

  constructor() {
    addIcons({ mailOutline, personAddOutline, fitnessOutline, informationCircleOutline, chatbubblesOutline });
  }

  ngOnInit() {
    // Aseguramos que el gesto de swipe esté habilitado (además del atributo en el template)
    this.menuCtrl.enable(true, 'notifications-menu');
  }

  async openMensaje(mensaje: any) {
    const modal = await this.modalCtrl.create({
      component: MensajeGlobalModalComponent,
      componentProps: {
        mensaje
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.read) {
      // It's marked as read inside the modal, so it should auto-update since it uses signals.
    }
  }

  async aceptarInvitacion(id: string) {
    try {
      await this.invitacionService.aceptarInvitacion(id);
      const toast = await this.toastCtrl.create({ message: 'Invitación aceptada exitosamente', duration: 2000, color: 'success' });
      await toast.present();
    } catch (e) {
      const toast = await this.toastCtrl.create({ message: 'Error al aceptar la invitación', duration: 2000, color: 'danger' });
      await toast.present();
    }
  }

  async rechazarInvitacion(id: string) {
    try {
      await this.invitacionService.rechazarInvitacion(id);
      const toast = await this.toastCtrl.create({ message: 'Invitación rechazada', duration: 2000, color: 'medium' });
      await toast.present();
    } catch (e) {
      console.error('Error al rechazar invitación:', e);
    }
  }

  async openChatList() {
    const modal = await this.modalCtrl.create({
      component: ChatListModalComponent,
      cssClass: 'premium-modal'
    });
    await modal.present();
  }
}
