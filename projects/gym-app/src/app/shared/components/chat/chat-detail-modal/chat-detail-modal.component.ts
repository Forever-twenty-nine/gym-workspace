import { Component, Input, inject, computed, signal, ViewChild, effect, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon,
  IonContent, IonFooter, IonTextarea, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, send, personOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { Rol, TipoMensaje, Mensaje } from 'gym-library';

@Component({
  selector: 'app-chat-detail-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonButton, IonIcon,
    IonContent, IonFooter, IonTextarea
  ],
  templateUrl: './chat-detail-modal.component.html'
})
export class ChatDetailModalComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly mensajeService = inject(MensajeService);
  private readonly modalCtrl = inject(ModalController);

  @Input({ required: true }) otherUserId!: string;

  @ViewChild(IonContent, { static: false }) content?: IonContent;

  currentUser = this.authService.currentUser;
  nuevoMensaje = signal<string>('');

  partnerUser = computed(() => {
    return this.userService.getUserByUid(this.otherUserId)();
  });

  partnerName = computed(() => {
    return this.partnerUser()?.nombre || 'Atleta';
  });

  partnerPhoto = computed(() => {
    return this.partnerUser()?.photoURL || null;
  });

  // Mensajes entre el usuario actual y el destinatario, ordenados cronológicamente
  mensajesFiltrados = computed(() => {
    const currId = this.currentUser()?.uid;
    const otherId = this.otherUserId;
    if (!currId) return [];

    const all = this.mensajeService.mensajes();
    
    // Filtrar conversaciones de ambas direcciones
    const conversation = all.filter(msg => 
      (msg.remitenteId === currId && msg.destinatarioId === otherId) ||
      (msg.remitenteId === otherId && msg.destinatarioId === currId)
    );

    // Ordenar de más antiguo a más nuevo para la vista
    const sorted = [...conversation].sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime());
    
    // Ejecutar marcado como leído asíncrono
    this.marcarMensajesComoLeidos(currId, otherId, sorted);

    return sorted;
  });

  constructor() {
    addIcons({ arrowBackOutline, send, personOutline });

    // Efecto reactivo para auto-scroll cuando cambia el número de mensajes
    effect(() => {
      this.mensajesFiltrados();
      this.scrollToBottom(150);
    });
  }

  scrollToBottom(delay = 100) {
    // Use afterNextRender for post-DOM updates instead of setTimeout when possible
    afterNextRender(() => {
      setTimeout(() => {
        this.content?.scrollToBottom(300).catch(() => {});
      }, delay);
    });
  }

  private async marcarMensajesComoLeidos(currentId: string, otherId: string, msgs: Mensaje[]) {
    // Filtrar los que no están leídos y son dirigidos a mí
    const unread = msgs.filter(m => m.destinatarioId === currentId && m.remitenteId === otherId && !m.leido);
    for (const m of unread) {
      if (m.id) {
        await this.mensajeService.marcarComoLeido(m.id).catch(console.error);
      }
    }
  }

  async enviarMensaje(event?: Event) {
    // Si se presiona Enter pero con shift, permitir salto de línea
    if (event && (event as KeyboardEvent).shiftKey) return;
    if (event) event.preventDefault();

    const txt = this.nuevoMensaje().trim();
    const currId = this.currentUser()?.uid;
    if (!txt || !currId) return;

    this.nuevoMensaje.set('');

    const msgId = `msg-pvt-${currId}-${this.otherUserId}-${Date.now()}`;
    const newMsg: Mensaje = {
      id: msgId,
      remitenteId: currId,
      remitenteTipo: Rol.ENTRENADO,
      destinatarioId: this.otherUserId,
      destinatarioTipo: Rol.ENTRENADO,
      contenido: txt,
      tipo: TipoMensaje.TEXTO,
      leido: false,
      entregado: true,
      fechaEnvio: new Date()
    };

    try {
      await this.mensajeService.save(newMsg);
      this.scrollToBottom(50);
    } catch (e) {
      console.error('Error al enviar mensaje:', e);
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
