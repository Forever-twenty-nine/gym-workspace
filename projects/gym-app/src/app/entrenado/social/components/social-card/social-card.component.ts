import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardContent, 
  IonAvatar, 
  IonIcon,
  IonButton, 
  IonCardHeader, 
  IonItem,
  IonLabel,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  barbellOutline, 
  timeOutline, 
  calendarOutline, 
  checkmark, 
  heart, 
  heartOutline, 
  ellipsisVertical 
} from 'ionicons/icons';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-social-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonAvatar,
    IonIcon,
    IonButton,
    IonGrid,
    IonRow,
    IonCol
  ],
  templateUrl: './social-card.component.html'
})
export class SocialCardComponent {
  private readonly _sesion = signal<any>(null);
  
  @Input({ required: true }) set sesion(value: any) {
    this._sesion.set(value);
  }

  get sesion() {
    return this._sesion();
  }

  private readonly sesionService = inject(SesionRutinaService);
  private readonly authService = inject(AuthService);

  // Perfil del usuario actual para los likes
  currentUser = this.authService.currentUser;

  // Computamos si el usuario actual le dio like basándonos en la señal
  hasLiked = computed(() => {
    const user = this.currentUser();
    const likes = this._sesion()?.likes || [];
    return user ? likes.includes(user.uid) : false;
  });

  // Computamos la cantidad de likes
  likesCount = computed(() => (this._sesion()?.likes || []).length);

  constructor() {
    addIcons({ 
      barbellOutline, 
      timeOutline, 
      calendarOutline, 
      checkmark, 
      heart, 
      heartOutline, 
      ellipsisVertical 
    });
  }

  toggleLike() {
    const user = this.currentUser();
    const currentSesion = this._sesion();
    
    if (!user || !currentSesion?.id) return;

    const sessionCopy = { ...currentSesion, likes: [...(currentSesion.likes || [])] };

    if (this.hasLiked()) {
      // Optimistic UI: Quitar localmente
      sessionCopy.likes = sessionCopy.likes.filter((id: string) => id !== user.uid);
      this._sesion.set(sessionCopy);
      
      this.sesionService.removeLike(currentSesion.id, user.uid)
        .catch(err => {
          console.error('❌ Error al quitar like:', err);
          this._sesion.set(currentSesion); // Revertir si falla
        });
    } else {
      // Optimistic UI: Añadir localmente
      sessionCopy.likes.push(user.uid);
      this._sesion.set(sessionCopy);

      this.sesionService.addLike(currentSesion.id, user.uid)
        .catch(err => {
          console.error('❌ Error al dar like:', err);
          this._sesion.set(currentSesion); // Revertir si falla
        });
    }
  }

  formatearFecha(fecha?: Date | string): string {
    if (!fecha) return '';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
  }

  redondearMinutos(segundos: number): number {
    return Math.round((segundos || 0) / 60);
  }
}
