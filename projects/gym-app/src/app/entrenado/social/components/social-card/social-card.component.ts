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
  ellipsisVertical,
  personAddOutline,
  personRemoveOutline
} from 'ionicons/icons';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';

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
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);

  // Perfil del usuario actual para los likes
  currentUser = this.authService.currentUser;

  // Computamos si el usuario actual le dio like basándonos en la señal
  hasLiked = computed(() => {
    const user = this.currentUser();
    const likes = this._sesion()?.likes || [];
    return user ? likes.includes(user.uid) : false;
  });

  // Perfil del entrenado actual para obtener a quién sigue
  currentEntrenado = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Computamos si el usuario actual sigue al autor de la sesión
  isFollowing = computed(() => {
    const entrenado = this.currentEntrenado();
    const targetUserId = this._sesion()?.entrenadoId;
    if (!entrenado || !targetUserId) return false;
    return (entrenado.seguidos || []).includes(targetUserId);
  });

  // Es mi propio post?
  isOwnPost = computed(() => {
    const user = this.currentUser();
    const posterId = this._sesion()?.entrenadoId;
    return user && posterId ? user.uid === posterId : false;
  });

  // Computamos la cantidad de likes
  likesCount = computed(() => (this._sesion()?.likes || []).length);

  // Computamos la foto de perfil con fallback a búsqueda dinámica
  userProfilePhoto = computed(() => {
    const sesion = this._sesion();
    if (!sesion) return null;

    // Si ya viene persistida en la sesión, la usamos (mejor performance)
    if (sesion.fotoUsuario) return sesion.fotoUsuario;

    // Fallback: Buscar en la lista de usuarios global por UID
    if (sesion.entrenadoId) {
      const user = this.userService.getUserByUid(sesion.entrenadoId)();
      return user?.photoURL || null;
    }

    return null;
  });

  constructor() {
    addIcons({
      barbellOutline,
      timeOutline,
      calendarOutline,
      checkmark,
      heart,
      heartOutline,
      ellipsisVertical,
      personAddOutline,
      personRemoveOutline
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

  async toggleFollow(event: Event) {
    event.stopPropagation();
    const currentUser = this.currentUser();
    const targetUserId = this._sesion()?.entrenadoId;

    if (!currentUser || !targetUserId) return;

    try {
      if (this.isFollowing()) {
        await this.entrenadoService.unfollowUser(currentUser.uid, targetUserId);
      } else {
        await this.entrenadoService.followUser(currentUser.uid, targetUserId);
      }
    } catch (err) {
      console.error('❌ Error al cambiar estado de seguimiento:', err);
    }
  }

  // Obtiene la foto de un usuario que dio like
  getLikeUserPhoto(uid: string): string | null {
    const user = this.userService.getUserByUid(uid)();
    return user?.photoURL || null;
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
