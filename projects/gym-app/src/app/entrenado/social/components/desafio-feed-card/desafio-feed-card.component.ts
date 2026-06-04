import {
  Component, Input, inject, signal, computed, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonIcon, IonButton, IonBadge, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, flameOutline, personOutline, checkmarkCircle,
  closeCircle, timerOutline, checkmarkOutline, closeOutline,
  ribbonOutline, sadOutline, trashOutline, peopleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { DesafioParticipacionService } from '../../../../core/services/desafio-participacion.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { Desafio, DesafioParticipacion } from 'gym-library';

@Component({
  selector: 'app-desafio-feed-card',
  standalone: true,
  imports: [CommonModule, IonCard, IonIcon, IonButton, IonBadge],
  templateUrl: './desafio-feed-card.component.html'
})
export class DesafioFeedCardComponent implements OnChanges {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly participacionService = inject(DesafioParticipacionService);
  private readonly desafioService = inject(DesafioService);
  private readonly toastCtrl = inject(ToastController);

  @Input({ required: true }) desafio!: Desafio;

  currentUser = this.authService.currentUser;
  loading = signal(false);

  // Participaciones reactivas del desafío
  participaciones = computed<DesafioParticipacion[]>(() => {
    if (!this.desafio?.id) return [];
    return this.participacionService.getParticipacionesByDesafio(this.desafio.id)();
  });

  // Mi participación en este desafío
  miParticipacion = computed<DesafioParticipacion | undefined>(() => {
    const uid = this.currentUser()?.uid;
    if (!uid || !this.desafio?.id) return undefined;
    return this.participacionService.getMisParticipaciones(uid)()
      .find(p => p.desafioId === this.desafio.id);
  });

  // Estado de la tarjeta
  esCreador = computed(() => this.currentUser()?.uid === this.desafio?.creadorId);

  yaAcepto = computed(() => !!this.miParticipacion());

  yaDeclaroResultado = computed(() => {
    const p = this.miParticipacion();
    return p?.estado === 'superado' || p?.estado === 'no_superado';
  });

  loSupero = computed(() => this.miParticipacion()?.estado === 'superado');

  // Countdown hasta vencimiento
  tiempoRestante = computed(() => {
    if (!this.desafio?.fechaVencimiento) return '';
    const diff = new Date(this.desafio.fechaVencimiento).getTime() - Date.now();
    if (diff <= 0) return 'Vencido';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  });

  vencio = computed(() => {
    if (!this.desafio?.fechaVencimiento) return false;
    return new Date(this.desafio.fechaVencimiento) <= new Date();
  });

  // Stats
  totalAceptaron = computed(() => this.participaciones().length);
  totalSuperaron = computed(() => this.participaciones().filter(p => p.estado === 'superado').length);
  totalNoSuperaron = computed(() => this.participaciones().filter(p => p.estado === 'no_superado').length);

  creatorName = computed(() => {
    if (!this.desafio) return 'Atleta';
    return this.userService.getUserByUid(this.desafio.creadorId)()?.nombre
      || this.desafio.creadorNombre;
  });

  creatorPhoto = computed(() => {
    if (!this.desafio) return null;
    return this.userService.getUserByUid(this.desafio.creadorId)()?.photoURL || null;
  });

  constructor() {
    addIcons({
      trophyOutline, flameOutline, personOutline, checkmarkCircle,
      closeCircle, timerOutline, checkmarkOutline, closeOutline,
      ribbonOutline, sadOutline, trashOutline, peopleOutline
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Inicializar listeners reactivos cuando llega el desafio
    if (changes['desafio']?.currentValue?.id) {
      const uid = this.currentUser()?.uid;
      if (uid) {
        this.participacionService.getMisParticipaciones(uid);
      }
      this.participacionService.getParticipacionesByDesafio(this.desafio.id);
    }
  }

  async aceptarDesafio() {
    const user = this.currentUser();
    if (!user || !this.desafio || this.loading()) return;

    this.loading.set(true);
    try {
      await this.participacionService.aceptarDesafio(
        this.desafio.id,
        user.uid,
        user.nombre || 'Atleta',
        user.photoURL
      );
      await this.showToast('¡Desafío aceptado! Ahora declaralo cuando lo hayas completado 💪', 'success');
    } catch (e) {
      console.error(e);
      await this.showToast('Error al aceptar el desafío', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async declararResultado(superado: boolean) {
    const participacion = this.miParticipacion();
    if (!participacion || this.loading()) return;

    this.loading.set(true);
    try {
      await this.participacionService.declararResultado(participacion.id, superado);
      const msg = superado
        ? '¡Increíble! Declaraste que lo superaste 🏆'
        : 'Próxima vez será, ya lo tenés en la mira 💪';
      await this.showToast(msg, superado ? 'success' : 'medium');
    } catch (e) {
      console.error(e);
      await this.showToast('Error al registrar el resultado', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async eliminarDesafio() {
    if (!this.desafio || this.loading()) return;
    this.loading.set(true);
    try {
      await this.desafioService.delete(this.desafio.id);
      await this.showToast('Desafío eliminado', 'medium');
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom', cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
