import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonButton, IonIcon, IonBadge, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, barbellOutline, trophyOutline, flameOutline, sparklesOutline,
  chatbubblesOutline, checkmarkCircleOutline, heartOutline, personOutline,
  hourglassOutline
} from 'ionicons/icons';
import { MatchService } from '../../../../core/services/match.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { Entrenado } from 'gym-library';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [
    CommonModule, IonCard, IonButton, IonIcon, IonBadge
  ],
  templateUrl: './match-card.component.html'
})
export class MatchCardComponent {
  private readonly matchService = inject(MatchService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastCtrl = inject(ToastController);

  @Input({ required: true }) tipo!: 'horario' | 'desafio' | 'afinidad';
  @Input({ required: true }) data!: any; // Perfil de Entrenado o Desafio

  currentUser = this.authService.currentUser;
  
  // Estado local para evitar doble submit
  interacted = signal<boolean>(false);
  matchConcretado = signal<boolean>(false);

  userName = computed(() => {
    if (!this.data) return 'Atleta';
    if (this.tipo === 'desafio') {
      return this.data.creadorNombre || '';
    }
    return this.data.id ? this.userService.getUserByUid(this.data.id)()?.nombre || 'Atleta' : 'Atleta';
  });

  userProfilePhoto = computed(() => {
    if (!this.data) return null;
    if (this.tipo === 'desafio') {
      return this.data.creadorFoto || null;
    }
    return this.data.id ? this.userService.getUserByUid(this.data.id)()?.photoURL || null : null;
  });

  constructor() {
    addIcons({
      timeOutline, barbellOutline, trophyOutline, flameOutline, sparklesOutline,
      chatbubblesOutline, checkmarkCircleOutline, heartOutline, personOutline,
      hourglassOutline
    });
  }

  async interactuar() {
    const user = this.currentUser();
    if (!user) return;

    this.interacted.set(true);
    let targetUserId = '';
    let referenciaId: string | undefined = undefined;

    if (this.tipo === 'desafio') {
      targetUserId = this.data.creadorId;
      referenciaId = this.data.id;
    } else {
      targetUserId = this.data.id;
    }

    try {
      const isMatch = await this.matchService.registrarInteres(
        user.uid,
        targetUserId,
        this.tipo,
        referenciaId
      );

      if (isMatch) {
        this.matchConcretado.set(true);
        if (this.tipo === 'afinidad') {
          this.showToast('¡Hay equipo! Encontramos a tu partner ideal para esta semana.');
        } else if (this.tipo === 'desafio') {
          this.showToast(`“A vos y a ${this.userName()} les gusta el mismo ritmo. ¿Por qué no arman un grupo?”`);
        } else {
          this.showToast('¡HAY MATCH MUTUO! Se ha abierto un chat para coordinar.');
        }
      } else {
        this.showToast('Interés enviado. Esperando respuesta del compañero.');
      }
    } catch (error) {
      console.error(error);
      this.interacted.set(false);
      this.showToast('No se pudo registrar tu interés. Intenta nuevamente.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
