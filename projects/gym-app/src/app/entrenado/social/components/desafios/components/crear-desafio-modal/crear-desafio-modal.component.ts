import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, trophyOutline, flameOutline, calendarOutline,
  helpCircleOutline, chevronDownOutline, chevronUpOutline
} from 'ionicons/icons';
import { DesafioService } from '../../../../../../core/services/desafio.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Desafio } from 'gym-library';


@Component({
  selector: 'app-crear-desafio-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonItem,
    IonModal, IonButtons, IonInput, IonTextarea
  ],
  templateUrl: './crear-desafio-modal.component.html'
})
export class CrearDesafioModalComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private desafioService = inject(DesafioService);
  private toastCtrl = inject(ToastController);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  mostrarAyuda = signal(false);
  saving = signal(false);

  form: FormGroup;

  // Fecha de vencimiento por defecto: 7 días
  private get defaultVencimiento(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  constructor() {
    addIcons({ close, trophyOutline, flameOutline, calendarOutline, helpCircleOutline, chevronDownOutline, chevronUpOutline });
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(180)]],
      logroRelacionado: ['', [Validators.maxLength(120)]],
      fechaVencimiento: [this.defaultVencimiento, Validators.required]
    });
  }

  toggleAyuda() {
    this.mostrarAyuda.update(v => !v);
  }

  closeModal() {
    this.close.emit();
    this.form.reset({ fechaVencimiento: this.defaultVencimiento });
  }

  async guardar() {
    if (this.form.invalid || this.saving()) return;

    const user = this.authService.currentUser();
    if (!user) {
      this.showToast('Debes iniciar sesión para publicar', 'danger');
      return;
    }
    if (!user.gimnasioId) {
      this.showToast('Debes tener un gimnasio asignado para publicar', 'danger');
      return;
    }

    const val = this.form.value;
    const [y, m, d] = val.fechaVencimiento.split('-').map(Number);
    const fechaVencimiento = new Date(y, m - 1, d, 23, 59, 59);

    if (fechaVencimiento <= new Date()) {
      this.showToast('La fecha de vencimiento debe ser futura', 'warning');
      return;
    }

    this.saving.set(true);
    try {
      const desafio: Desafio = {
        id: '',
        creadorId: user.uid,
        creadorNombre: user.nombre || 'Atleta',
        creadorFoto: user.photoURL || null,
        gimnasioId: user.gimnasioId,
        titulo: val.titulo.trim(),
        logroRelacionado: val.logroRelacionado?.trim() || undefined,
        fechaCreacion: new Date(),
        fechaVencimiento,
        activo: true
      };

      await this.desafioService.save(desafio);
      this.showToast('¡Desafío lanzado! 🏆', 'success');
      this.saved.emit();
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.showToast('Error al publicar el desafío', 'danger');
    } finally {
      this.saving.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }
}
