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
  IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark } from 'ionicons/icons';
import { TipoEntrenamiento } from 'gym-library';
import { BackgroundComponent } from '../../background/background.component';

@Component({
  selector: 'app-tipo-entrenamiento-modal',
  templateUrl: './tipo-entrenamiento-modal.html',
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
    IonList
]
})
export class TipoEntrenamientoModalComponent {
  private fb = inject(FormBuilder);

  isOpen = input.required<boolean>();
  tipo = input<TipoEntrenamiento | null>(null);
  isCreating = input<boolean>(false);

  close = output<void>();
  save = output<string>();

  readonly form = signal<FormGroup | null>(null);
  private readonly formStatus = signal<string>('INVALID');

  readonly isSaveDisabled = computed(() => {
    return this.formStatus() === 'INVALID';
  });

  constructor() {
    addIcons({ close, checkmark });

    effect(() => {
      const item = this.tipo();
      const open = this.isOpen();
      if (open) {
        const formGroup = this.fb.group({
          nombre: [item ? item.nombre : '', [Validators.required, Validators.maxLength(30)]]
        });
        formGroup.statusChanges.subscribe(status => this.formStatus.set(status));
        this.form.set(formGroup);
        this.formStatus.set(formGroup.status);
      }
    });
  }

  onSave() {
    const f = this.form();
    if (f && f.valid) {
      this.save.emit(f.value.nombre.trim());
    }
  }
}
