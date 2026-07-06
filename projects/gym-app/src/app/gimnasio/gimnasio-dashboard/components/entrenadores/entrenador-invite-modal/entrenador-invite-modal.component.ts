import { Component, input, output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonButtons 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-entrenador-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonButtons
  ],
  templateUrl: './entrenador-invite-modal.component.html'
})
export class EntrenadorInviteModalComponent {
  isOpen = input<boolean>(false);
  close = output<void>();
  save = output<{ email: string; mensaje: string }>();

  private fb = inject(FormBuilder);
  
  invitacionForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    mensaje: ['']
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.invitacionForm.reset();
      }
    });
  }

  cancel() {
    this.close.emit();
  }

  submit() {
    if (this.invitacionForm.invalid) {
      this.invitacionForm.markAllAsTouched();
      return;
    }
    const email = this.invitacionForm.value.email?.trim() || '';
    const mensaje = this.invitacionForm.value.mensaje || '';
    this.save.emit({ email, mensaje });
  }
}
