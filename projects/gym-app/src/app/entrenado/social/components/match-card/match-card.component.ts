import { Component, Input, inject, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
   IonCard, IonButton, IonIcon, ToastController
 } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
   barbellOutline, trophyOutline, flameOutline, sparklesOutline,
   chatbubblesOutline, checkmarkCircleOutline, heartOutline, personOutline, timeOutline, peopleOutline
 } from 'ionicons/icons';
import { MatchService } from '../../../../core/services/match.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { Entrenado } from 'gym-library';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [
    CommonModule, IonCard, IonButton, IonIcon
  ],
  templateUrl: './match-card.component.html'
})
export class MatchCardComponent implements OnChanges {
  private readonly matchService = inject(MatchService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toastCtrl = inject(ToastController);

  @Input({ required: true }) tipo!: 'desafio' | 'afinidad' | 'horario';
  @Input({ required: true }) data!: any; // Perfil de Entrenado o Desafio
  @Input() showActions = true;
  @Input() photoURL: string | null = null; // resolved from parent for reliable first-load photos
  @Input() photoVersion: number = 0; // bumped by parent when users first load → forces re-evaluation of photo computeds

  currentUser = this.authService.currentUser;
  
  // Estado local para evitar doble submit
  interacted = signal<boolean>(false);
  matchConcretado = signal<boolean>(false);

  // Para manejar fallback de foto que no carga en primera render
  photoFailed = signal<boolean>(false);

  userName = computed(() => {
    if (!this.data) return 'Atleta';
    if (this.tipo === 'desafio') {
      return this.data.creadorNombre || '';
    }
    return this.data.id ? this.userService.getUserByUid(this.data.id)()?.nombre || 'Atleta' : 'Atleta';
  });

  userInitials = computed(() => {
    const name = this.userName();
    if (!name || name === 'Atleta') return 'A';
    return name.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').substring(0, 2);
  });

  // Stable lookup (created once per card instance) so updates from UserService after first render are picked up
  private readonly resolvedUser = computed(() => {
    const id = this.data?.id;
    if (!id || this.tipo === 'desafio') return null;
    return this.userService.getUserByUid(id)();
  });

  userProfilePhoto = computed(() => {
    // Reading photoVersion here makes this computed (and safePhoto) re-run
    // whenever the parent bumps it on first users load.
    const _ = this.photoVersion;

    if (!this.data) return null;

    // Prefer explicitly passed photoURL (from parent enriched list)
    if (this.photoURL != null) {
      return this.photoURL || null;
    }

    // If the data object itself is enriched with photoURL (from sugerencias* in parent)
    if (this.data.photoURL != null) {
      return this.data.photoURL || null;
    }

    if (this.tipo === 'desafio') {
      return this.data.creadorFoto || null;
    }

    // Live reactive lookup (the resolvedUser computed depends on the UserService signal)
    const user = this.resolvedUser();
    return user?.photoURL || null;
  });

  safePhoto = computed(() => {
    if (this.photoFailed()) return null;
    return this.userProfilePhoto();
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['photoVersion']) {
      this.photoFailed.set(false);
    }
  }

  onPhotoError(): void {
    this.photoFailed.set(true);
  }

  constructor() {
    addIcons({
      barbellOutline, trophyOutline, flameOutline, sparklesOutline,
      chatbubblesOutline, checkmarkCircleOutline, heartOutline, personOutline, timeOutline, peopleOutline
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
