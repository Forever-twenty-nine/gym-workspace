import { Component, input, output, effect, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonIcon,
  IonItem,
  IonInput,
  IonTextarea,
  IonText,
  IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star } from 'ionicons/icons';
import { EditModalComponent } from '../../../../shared/components/edit-modal/edit-modal.component';

@Component({
  selector: 'app-ejercicio-modal',
  templateUrl: './ejercicio-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EditModalComponent,
    IonIcon,
    IonItem,
    IonInput,
    IonTextarea,
    IonText,
    IonList
  ]
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
    addIcons({ star });

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
