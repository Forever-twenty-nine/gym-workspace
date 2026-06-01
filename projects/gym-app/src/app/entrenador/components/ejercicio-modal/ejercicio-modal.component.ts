import { Component, input, output, effect, signal, computed, inject } from '@angular/core';
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
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, star } from 'ionicons/icons';

@Component({
  selector: 'app-ejercicio-modal',
  templateUrl: './ejercicio-modal.component.html',
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
    IonItem,
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonText
  ],
  styles: [`
    .ejercicio-modal {
      --width: 95%;
      --max-width: 600px;
      --border-radius: 16px;
      --backdrop-opacity: 0.3;
    }
    .gym-modal-item {
      --background: rgba(255, 255, 255, 0.05);
      --border-radius: 12px;
      --border-width: 1px;
      --border-style: solid;
      --border-color: rgba(255, 255, 255, 0.08);
      --padding-start: 16px;
      --padding-end: 16px;
    }
  `]
})
export class EjercicioModalComponent {
  private fb = inject(FormBuilder);

  isOpen = input.required<boolean>();
  ejercicio = input<any>(null);
  isCreating = input<boolean>(false);
  isFreePlan = input<boolean>(true);

  close = output<void>();
  save = output<any>();

  readonly form = signal<FormGroup | null>(null);
  private readonly formStatus = signal<string>('INVALID');

  readonly isSaveDisabled = computed(() => {
    return this.formStatus() === 'INVALID';
  });

  constructor() {
    addIcons({ close, star });

    // Cuando cambia el ejercicio o el estado de apertura, recreamos el formulario
    effect(() => {
      const item = this.ejercicio();
      const open = this.isOpen();
      if (open && item) {
        this.createForm(item);
      } else {
        this.form.set(null);
      }
    });
  }

  private createForm(item: any) {
    const formConfig: any = {
      nombre: [item.nombre || '', [Validators.required]],
      descripcion: [item.descripcion || ''],
      series: [item.series || 1, [Validators.required, Validators.min(1)]],
      repeticiones: [item.repeticiones || 1, [Validators.required, Validators.min(1)]],
      peso: [item.peso || 0],
      creadorId: [item.creadorId || ''],
      creadorTipo: [item.creadorTipo || 'entrenador']
    };

    if (!this.isFreePlan()) {
      formConfig.serieSegundos = [item.serieSegundos || 0];
      formConfig.descansoSegundos = [item.descansoSegundos || 60];
    }

    const formGroup = this.fb.group(formConfig);
    this.form.set(formGroup);

    formGroup.statusChanges.subscribe(status => {
      this.formStatus.set(status);
    });
    this.formStatus.set(formGroup.status);
  }

  onSubmit() {
    const formGroup = this.form();
    if (formGroup && formGroup.valid) {
      this.save.emit(formGroup.value);
    }
  }
}
