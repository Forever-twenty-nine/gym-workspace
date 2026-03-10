import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonIcon, ActionSheetController, IonCard, IonItem, IonLabel, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbell, time, heart, heartOutline, ellipsisVertical, ellipsisHorizontal,
  personAdd, personRemove, trash, eyeOffOutline, timeOutline, barbellOutline
} from 'ionicons/icons';

import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { FormatFechaPipe } from '../../../../shared/pipes/format-fecha.pipe';

@Component({
  selector: 'app-social-card',
  standalone: true,
  imports: [
    CommonModule, IonIcon, FormatFechaPipe,
    IonCard, IonItem, IonLabel, IonButtons, IonButton
  ],
  templateUrl: './social-card.component.html'
})
export class SocialCardComponent {
  private readonly _sesion = signal<any>(null);
  @Input({ required: true }) set sesion(value: any) { this._sesion.set(value); }
  get sesion() { return this._sesion(); }

  private readonly sesionService = inject(SesionRutinaService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  currentUser = this.authService.currentUser;
  hasLiked = computed(() => this.currentUser() ? (this._sesion()?.likes || []).includes(this.currentUser()!.uid) : false);
  currentEntrenado = computed(() => this.currentUser() ? this.entrenadoService.getEntrenado(this.currentUser()!.uid)() : null);
  isFollowing = computed(() => {
    const e = this.currentEntrenado();
    const target = this._sesion()?.entrenadoId;
    return e && target ? (e.seguidos || []).includes(target) : false;
  });
  isOwnPost = computed(() => this.currentUser() && this._sesion() ? this.currentUser()!.uid === this._sesion().entrenadoId : false);
  likesCount = computed(() => (this._sesion()?.likes || []).length);

  userProfilePhoto = computed(() => {
    const s = this._sesion();
    if (!s) return null;
    if (s.fotoUsuario) return s.fotoUsuario;
    return s.entrenadoId ? this.userService.getUserByUid(s.entrenadoId)()?.photoURL || null : null;
  });

  constructor() {
    addIcons({ barbell, time, heart, heartOutline, ellipsisVertical, ellipsisHorizontal, personAdd, personRemove, trash, eyeOffOutline, timeOutline, barbellOutline });
  }

  async toggleLike() {
    const user = this.currentUser();
    const s = this._sesion();
    if (!user || !s?.id) return;

    const liked = this.hasLiked();
    const updatedLikes = liked ? s.likes.filter((id: string) => id !== user.uid) : [...(s.likes || []), user.uid];
    this._sesion.set({ ...s, likes: updatedLikes });

    try {
      liked ? await this.sesionService.removeLike(s.id, user.uid) : await this.sesionService.addLike(s.id, user.uid);
    } catch (e) {
      console.error(e);
      this._sesion.set(s);
    }
  }

  async toggleFollow(event: Event) {
    event.stopPropagation();
    const user = this.currentUser();
    const target = this._sesion()?.entrenadoId;
    if (!user || !target) return;
    try {
      this.isFollowing() ? await this.entrenadoService.unfollowUser(user.uid, target) : await this.entrenadoService.followUser(user.uid, target);
    } catch (e) { console.error(e); }
  }

  async presentOptions(event: Event) {
    event.stopPropagation();
    if (!this.isOwnPost()) return;

    const sheet = await this.actionSheetCtrl.create({
      header: 'Gestionar Actividad',
      cssClass: 'premium-action-sheet',
      buttons: [
        { text: 'Dejar de compartir', icon: 'eye-off-outline', handler: () => this.sesionService.setCompartida(this.sesion.id, false).catch(console.error) },
        { text: 'Eliminar actividad', role: 'destructive', icon: 'trash', handler: () => this.sesionService.eliminarSesion(this.sesion.id).catch(console.error) },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  getLikeUserPhoto(uid: string) { return this.userService.getUserByUid(uid)()?.photoURL || null; }
  redondearMinutos(segundos: number) { return Math.round((segundos || 0) / 60); }
}
