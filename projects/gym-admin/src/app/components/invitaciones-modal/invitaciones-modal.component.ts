import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  NotificacionService,
  UserService,
  EntrenadoService
} from 'gym-library';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-invitaciones-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './invitaciones-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitacionesModalComponent {
  // Servicios inyectados
  private readonly notificacionService = inject(NotificacionService);
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  // Inputs
  isOpen = input.required<boolean>();
  entrenadorId = input<string>('');

  // Outputs
  close = output<void>();

  // Signals internos
  readonly isLoading = signal(false);

  // Formulario reactivo para invitaciones
  readonly invitacionForm = signal<FormGroup>(
    this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: [''],
      franjaHoraria: ['mañana']
    })
  );

  // Computed
  readonly usuarios = computed(() => {
    return this.userService.users().map(user => ({
      ...user,
      displayName: user.nombre || user.email || `Usuario ${user.uid}`
    }));
  });

  readonly invitacionesEntrenador = computed(() => {
    const entrenadorId = this.entrenadorId();
    if (!entrenadorId) return [];

    return this.notificacionService.getInvitacionesPorEntrenador(entrenadorId)()
      .map(notif => {
        const entrenado = this.entrenadoService.entrenados().find(e => e.id === notif.usuarioId);
        const usuarioEntrenado = entrenado ? this.usuarios().find(u => u.uid === entrenado.id) : null;

        return {
          ...notif,
          titulo: `Invitación a ${usuarioEntrenado?.nombre || usuarioEntrenado?.email || 'cliente'}`,
          entrenadorNombre: 'Entrenador',
          invitacionId: notif.id,
          estado: notif.datos?.estadoInvitacion || 'pendiente'
        };
      });
  });

  // Cerrar modal
  onClose() {
    this.close.emit();
  }

  // Enviar invitación
  async onEnviarInvitacion() {
    const form = this.invitacionForm();

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
      form.markAllAsTouched();
      return;
    }

    const data = form.value;
    const entrenadorId = this.entrenadorId();

    if (!entrenadorId) {
      this.toastService.log('Error: No se ha especificado el entrenador');
      return;
    }

    const usuarioInvitado = this.usuarios().find(u => u.email === data.email);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId) {
      this.toastService.log('ERROR: No se encontró un usuario con ese email');
      return;
    }

    this.isLoading.set(true);

    try {
      await this.notificacionService.crearInvitacion(entrenadorId, usuarioId, data.mensaje);

      this.toastService.log('Invitación enviada exitosamente');
      this.invitacionForm().reset();
      this.close.emit();

    } catch (error) {
      console.error('❌ Error al guardar notificación:', error);
      this.toastService.log('ERROR al enviar invitación');
    } finally {
      this.isLoading.set(false);
    }
  }
}