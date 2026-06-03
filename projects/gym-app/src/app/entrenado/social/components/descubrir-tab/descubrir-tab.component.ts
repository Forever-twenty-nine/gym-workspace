import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, barbellOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { MatchService } from '../../../../core/services/match.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { UserService } from '../../../../core/services/user.service';
import { MatchCardComponent } from '../match-card/match-card.component';

@Component({
  selector: 'app-descubrir-tab',
  templateUrl: './descubrir-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    MatchCardComponent
  ]
})
export class DescubrirTabComponent {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private matchService = inject(MatchService);
  private desafioService = inject(DesafioService);
  private userService = inject(UserService);

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  sugerenciasAfinidad = computed(() => {
    const curr = this.currentEntrenado();
    return curr ? this.matchService.getSugerenciasAfinidad(curr)() : [];
  });

  // Desafíos filtrados por gimnasio
  desafiosActivos = computed(() => {
    const list = this.desafioService.desafios();
    const currentUserGymId = this.authService.currentUser()?.gimnasioId;
    return list.filter(d => {
      const creatorProfile = this.userService.getUserByUid(d.creadorId)();
      return creatorProfile?.gimnasioId === currentUserGymId;
    });
  });

  constructor() {
    addIcons({ trophyOutline, barbellOutline });
  }
}

