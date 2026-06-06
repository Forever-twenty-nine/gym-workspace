import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  IonPopover,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, saveOutline, barbellOutline, helpCircleOutline } from 'ionicons/icons';
import { EjercicioService } from '../../../../../core/services/ejercicio.service';
import { EntrenadoService } from '../../../../../core/services/entrenado.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-ejercicio-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonPopover,
    IonContent
  ],
  templateUrl: './ejercicio-modal.component.html'
})
export class EjercicioModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private toastCtrl = inject(ToastController);

  @Input() isOpen = false;
  @Input() item: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  isEditing = false;

  form: FormGroup;

  constructor() {
    addIcons({ close, saveOutline, barbellOutline, helpCircleOutline });

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      series: [3, [Validators.required, Validators.min(1)]],
      repeticiones: [12, [Validators.required, Validators.min(1)]],
      peso: [0]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && this.item) {
      this.loadItemForEdit();
    }
  }

  private loadItemForEdit() {
    if (!this.item) return;
    this.isEditing = true;

    this.form.patchValue({
      nombre: this.item.nombre || '',
      descripcion: this.item.descripcion || '',
      series: this.item.series || 3,
      repeticiones: this.item.repeticiones || 12,
      peso: this.item.peso || 0
    });
  }

  closeModal() {
    this.close.emit();
    this.isEditing = false;
    this.form.reset({
      series: 3,
      repeticiones: 12,
      peso: 0
    });
  }

  async guardar() {
    if (this.form.invalid || this.saving()) return;

    const user = this.authService.currentUser();
    if (!user) {
      this.showToast('Debes iniciar sesión', 'danger');
      return;
    }

    const uid = user.uid;

    this.saving.set(true);
    try {
      const formValue = this.form.value;

      let ejercicioData: any;

      if (this.isEditing && this.item) {
        ejercicioData = {
          ...this.item,
          nombre: (formValue.nombre || '').trim(),
          descripcion: (formValue.descripcion || '').trim(),
          series: Number(formValue.series) || 3,
          repeticiones: Number(formValue.repeticiones) || 12,
          peso: Number(formValue.peso) || 0,
        };
      } else {
        ejercicioData = {
          id: 'ej-' + Date.now(),
          nombre: (formValue.nombre || '').trim(),
          descripcion: (formValue.descripcion || '').trim(),
          series: Number(formValue.series) || 3,
          repeticiones: Number(formValue.repeticiones) || 12,
          peso: Number(formValue.peso) || 0,
          descansoSegundos: 60,
          serieSegundos: 0,
          creadorId: uid,
        };
      }

      await this.ejercicioService.save(ejercicioData);

      if (!this.isEditing) {
        await this.entrenadoService.addEjercicioCreado(uid, ejercicioData.id);
      }

      this.showToast(this.isEditing ? 'Ejercicio actualizado' : 'Ejercicio creado con éxito', 'success');
      this.saved.emit();
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.showToast(this.isEditing ? 'Error al actualizar el ejercicio' : 'Error al crear el ejercicio', 'danger');
    } finally {
      this.saving.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
