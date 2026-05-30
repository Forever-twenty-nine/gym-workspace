import { Component, Input, inject, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, flameOutline, personOutline, closeOutline, checkmarkOutline, chatbubblesOutline } from 'ionicons/icons';
import { MatchService } from '../../../../core/services/match.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-desafio-feed-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonIcon, IonButton],
  templateUrl: './desafio-feed-card.component.html'
})
export class DesafioFeedCardComponent {
  private readonly matchService = inject(MatchService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  @Input({ required: true }) desafio!: any;
  @Output() dismissed = new EventEmitter<'accept' | 'pass'>();

  currentUser = this.authService.currentUser;
  matchConcretado = signal<boolean>(false);
  interacted = signal<boolean>(false);

  creatorName = computed(() => {
    if (!this.desafio) return 'Atleta';
    return this.desafio.creadorId ? this.userService.getUserByUid(this.desafio.creadorId)()?.nombre || this.desafio.creadorNombre : this.desafio.creadorNombre;
  });

  creatorPhoto = computed(() => {
    if (!this.desafio) return null;
    return this.desafio.creadorId ? this.userService.getUserByUid(this.desafio.creadorId)()?.photoURL || null : null;
  });

  constructor() {
    addIcons({ trophyOutline, flameOutline, personOutline, closeOutline, checkmarkOutline, chatbubblesOutline });
  }

  async aceptarDesafio() {
    const user = this.currentUser();
    if (!user || !this.desafio || this.interacted()) return;

    this.interacted.set(true);
    try {
      const isMatch = await this.matchService.registrarInteres(
        user.uid,
        this.desafio.creadorId,
        'desafio',
        this.desafio.id
      );

      if (isMatch) {
        this.matchConcretado.set(true);
      }
      this.dismissed.emit('accept');
    } catch (e) {
      console.error('Error al registrar interes en desafio:', e);
      this.interacted.set(false);
    }
  }

  ignorarDesafio() {
    if (this.interacted()) return;
    this.interacted.set(true);
    this.dismissed.emit('pass');
  }
}
