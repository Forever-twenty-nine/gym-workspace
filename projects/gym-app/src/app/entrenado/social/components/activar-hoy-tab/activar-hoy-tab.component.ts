import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonIcon,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, personOutline, timeOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { MatchService } from '../../../../core/services/match.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-activar-hoy-tab',
  templateUrl: './activar-hoy-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonBadge
  ]
})
export class ActivarHoyTabComponent {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private matchService = inject(MatchService);
  private userService = inject(UserService);

  readonly currentUserSignal = this.authService.currentUser;

  // Estados locales para interacciones rápidas
  usuariosInteractuadosHoy = signal<string[]>([]);

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Sugerencias sociales calculadas reactivamente
  sugerenciasHorario = computed(() => {
    const curr = this.currentEntrenado();
    return curr ? this.matchService.getSugerenciasHorario(curr)() : [];
  });

  // Sugerencias de disponibilidad horaria filtrando las ya interactuadas
  sugerenciasDisponibilidad = computed(() => {
    const list = this.sugerenciasHorario();
    const interactuados = this.usuariosInteractuadosHoy();
    return list.filter(user => !interactuados.includes(user.id));
  });

  constructor() {
    addIcons({ checkmarkOutline, closeOutline, personOutline, timeOutline });
  }

  async conectarUsuario(userId: string) {
    const user = this.currentUserSignal();
    if (!user) return;
    this.usuariosInteractuadosHoy.update(list => [...list, userId]);
    
    try {
      await this.matchService.registrarInteres(user.uid, userId, 'horario');
    } catch (e) {
      console.error('Error al registrar interes horaria:', e);
    }
  }

  pasarUsuario(userId: string) {
    this.usuariosInteractuadosHoy.update(list => [...list, userId]);
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }
}
