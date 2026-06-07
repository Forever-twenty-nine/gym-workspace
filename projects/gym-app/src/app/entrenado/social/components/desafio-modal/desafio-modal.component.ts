import {
  Component, Input, Output, EventEmitter, inject, signal, computed, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonBadge,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, closeOutline, checkmarkOutline, closeCircle, ribbonOutline,
  sadOutline, peopleOutline, timerOutline, trashOutline, personOutline
} from 'ionicons/icons';
import { Desafio, DesafioParticipacion } from 'gym-library';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { DesafioParticipacionService } from '../../../../core/services/desafio-participacion.service';
import { DesafioService } from '../../../../core/services/desafio.service';

@Component({
  selector: 'app-desafio-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonButton,
    IonIcon,
    IonBadge
  ],
  templateUrl: './desafio-modal.component.html',
  styles: [`
    ion-modal {
      --border-radius: 24px;
      --width: min(94%, 420px);
      --height: auto;
      --max-height: 86vh;
    }
    .desafio-modal-card {
      border-radius: 24px;
      overflow: hidden;
    }
  `]
})
export class DesafioModalComponent implements OnChanges {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly participacionService = inject(DesafioParticipacionService);
  private readonly desafioService = inject(DesafioService);
  private readonly toastCtrl = inject(ToastController);

  @Input() isOpen = false;
  @Input() desafio: Desafio | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<string>();
  @Output() pasar = new EventEmitter<string>();  // user chose "Pasar" on this desafio

  currentUser = this.authService.currentUser;
  loading = signal(false);

  // Participaciones reactivas
  participaciones = computed<DesafioParticipacion[]>(() => {
    if (!this.desafio?.id) return [];
    return this.participacionService.getParticipacionesByDesafio(this.desafio.id)();
  });

  miParticipacion = computed<DesafioParticipacion | undefined>(() => {
    const uid = this.currentUser()?.uid;
    if (!uid || !this.desafio?.id) return undefined;
    return this.participacionService.getMisParticipaciones(uid)()
      .find(p => p.desafioId === this.desafio!.id);
  });

  esCreador = computed(() => this.currentUser()?.uid === this.desafio?.creadorId);

  yaAcepto = computed(() => !!this.miParticipacion());

  yaDeclaroResultado = computed(() => {
    const p = this.miParticipacion();
    return p?.estado === 'superado' || p?.estado === 'no_superado';
  });

  loSupero = computed(() => this.miParticipacion()?.estado === 'superado');

  vencio = computed(() => {
    if (!this.desafio?.fechaVencimiento) return false;
    return new Date(this.desafio.fechaVencimiento) <= new Date();
  });

  tiempoRestante = computed(() => {
    if (!this.desafio?.fechaVencimiento) return '';
    const diff = new Date(this.desafio.fechaVencimiento).getTime() - Date.now();
    if (diff <= 0) return 'Vencido';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  });

  totalAceptaron = computed(() => this.participaciones().length);
  totalSuperaron = computed(() => this.participaciones().filter(p => p.estado === 'superado').length);
  totalNoSuperaron = computed(() => this.participaciones().filter(p => p.estado === 'no_superado').length);

  creatorName = computed(() => {
    if (!this.desafio) return 'Atleta';
    return this.userService.getUserByUid(this.desafio.creadorId)()?.nombre || this.desafio.creadorNombre;
  });

  creatorPhoto = computed(() => {
    if (!this.desafio) return null;
    return this.userService.getUserByUid(this.desafio.creadorId)()?.photoURL || null;
  });

  constructor() {
    addIcons({
      trophyOutline, closeOutline, checkmarkOutline, closeCircle, ribbonOutline,
      sadOutline, peopleOutline, timerOutline, trashOutline, personOutline
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['desafio']?.currentValue?.id) {
      const uid = this.currentUser()?.uid;
      if (uid) {
        this.participacionService.getMisParticipaciones(uid);
      }
      this.participacionService.getParticipacionesByDesafio(this.desafio!.id);
    }
  }

  async aceptarDesafio() {
    const user = this.currentUser();
    const d = this.desafio;
    if (!user || !d || this.loading() || this.vencio()) return;

    this.loading.set(true);
    try {
      await this.participacionService.aceptarDesafio(
        d.id,
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
    const d = this.desafio;
    if (!d || this.loading()) return;

    this.loading.set(true);
    try {
      await this.desafioService.delete(d.id);
      await this.showToast('Desafío eliminado', 'medium');
      this.deleted.emit(d.id);
      this.close.emit();
    } catch (e) {
      console.error(e);
      await this.showToast('Error al eliminar', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  pasarYcerrar() {
    // "Pasar" = no aceptar por ahora + avisar al padre para ocultarlo de la barra de stories
    const id = this.desafio?.id;
    if (id) {
      this.pasar.emit(id);
    }
    this.close.emit();
  }

  onDidDismiss() {
    this.close.emit();
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2400,
      color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
