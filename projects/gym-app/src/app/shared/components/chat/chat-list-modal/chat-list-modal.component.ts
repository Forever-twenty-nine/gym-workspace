import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon,
  IonContent, IonSearchbar, IonBadge, ModalController, IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline, personOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { ChatDetailModalComponent } from '../chat-detail-modal/chat-detail-modal.component';
import { PageBackgroundComponent } from '../../page-background/page-background.component';
import { Mensaje } from 'gym-library';

@Component({
  selector: 'app-chat-list-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon,
    IonContent, IonSearchbar, IonBadge, IonTitle,
    PageBackgroundComponent
  ],
  templateUrl: './chat-list-modal.component.html'
})
export class ChatListModalComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly mensajeService = inject(MensajeService);
  private readonly modalCtrl = inject(ModalController);

  currentUser = this.authService.currentUser;
  searchQuery = signal<string>('');

  // Hilos de conversación computados a partir de los mensajes
  chatsActivos = computed(() => {
    const currentId = this.currentUser()?.uid;
    if (!currentId) return [];

    const msgs = this.mensajeService.mensajes();
    const map = new Map<string, { lastMsg: Mensaje, unreadCount: number }>();

    // Ordenar mensajes del más antiguo al más nuevo para procesar el último al final
    const sorted = [...msgs].sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime());

    for (const msg of sorted) {
      if (msg.remitenteId === currentId || msg.destinatarioId === currentId) {
        const otherId = msg.remitenteId === currentId ? msg.destinatarioId : msg.remitenteId;

        let info = map.get(otherId);
        if (!info) {
          info = { lastMsg: msg, unreadCount: 0 };
        } else {
          info.lastMsg = msg;
        }

        // Si yo soy el destinatario y el mensaje no ha sido leído, incrementar contador
        if (msg.destinatarioId === currentId && !msg.leido) {
          info.unreadCount++;
        }

        map.set(otherId, info);
      }
    }

    // Mapear a objetos de hilo y resolver perfiles de usuario
    return Array.from(map.entries()).map(([otherUserId, info]) => {
      const otherUser = this.userService.getUserByUid(otherUserId)();
      return {
        otherUserId,
        otherUser,
        lastMsg: info.lastMsg,
        unreadCount: info.unreadCount
      };
    }).sort((a, b) => b.lastMsg.fechaEnvio.getTime() - a.lastMsg.fechaEnvio.getTime());
  });

  // Chats filtrados por el texto del buscador
  chatsFiltrados = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.chatsActivos();
    if (!query) return list;

    return list.filter(chat => {
      const nombre = chat.otherUser?.nombre?.toLowerCase() || '';
      return nombre.includes(query);
    });
  });

  constructor() {
    addIcons({ closeOutline, searchOutline, personOutline, chatbubblesOutline });
  }

  async abrirConversacion(otherUserId: string) {
    const modal = await this.modalCtrl.create({
      component: ChatDetailModalComponent,
      componentProps: {
        otherUserId
      },
      cssClass: 'premium-modal'
    });
    return await modal.present();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  onSearch(event: { detail?: { value?: string | null } }) {
    this.searchQuery.set(event.detail?.value || '');
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  }
}
