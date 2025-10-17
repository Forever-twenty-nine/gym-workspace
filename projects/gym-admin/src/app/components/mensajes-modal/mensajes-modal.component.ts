import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MensajeService,
  ConversacionService,
  NotificacionService,
  UserService,
  Mensaje,
  Conversacion,
  Notificacion,
  TipoNotificacion,
  Rol
} from 'gym-library';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-mensajes-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './mensajes-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MensajesModalComponent {
  // Servicios inyectados
  private readonly mensajeService = inject(MensajeService);
  private readonly conversacionService = inject(ConversacionService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  // Inputs
  isOpen = input<boolean>(false);
  isCreating = input<boolean>(false);
  remitenteId = input<string>('');

  // Outputs
  close = output<void>();

  // Signals internos
  readonly mensajeData = signal<Mensaje | null>(null);
  readonly isLoading = signal(false);

  // Formulario reactivo
  mensajeForm = signal<FormGroup>(this.createForm());

  // Computed
  readonly modalTitle = computed(() => {
    return this.isCreating() ? 'Crear Mensaje' : 'Editar Mensaje';
  });

  readonly usuarios = computed(() => {
    return this.userService.users().map(user => ({
      ...user,
      displayName: user.nombre || user.email || `Usuario ${user.uid}`
    }));
  });

  readonly mensajes = computed(() => {
    return this.mensajeService.mensajes().map(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      const destinatario = this.usuarios().find(u => u.uid === mensaje.destinatarioId);

      const remitenteNombre = remitente?.nombre || remitente?.email || `Usuario ${mensaje.remitenteId}`;
      const destinatarioNombre = destinatario?.nombre || destinatario?.email || `Usuario ${mensaje.destinatarioId}`;

      // Mostrar solo el tipo de mensaje
      const titulo = mensaje.tipo || 'texto';

      return {
        ...mensaje,
        titulo,
        remitenteChip: remitenteNombre,
        destinatarioChip: destinatarioNombre
      };
    });
  });

  // Crear formulario
  private createForm(): FormGroup {
    return this.fb.group({
      remitenteId: [{ value: this.remitenteId() || '', disabled: !!this.remitenteId() }, Validators.required],
      destinatarioId: ['', Validators.required],
      contenido: ['', Validators.required],
      tipo: ['texto', Validators.required]
    });
  }

  // Inicializar formulario con datos
  initializeForm(mensaje?: Mensaje) {
    if (mensaje) {
      this.mensajeData.set({ ...mensaje });
      this.mensajeForm().patchValue({
        remitenteId: mensaje.remitenteId || this.remitenteId() || '',
        destinatarioId: mensaje.destinatarioId || '',
        contenido: mensaje.contenido || '',
        tipo: mensaje.tipo || 'texto'
      });
    } else {
      this.mensajeData.set(null);
      this.mensajeForm().reset({
        remitenteId: this.remitenteId() || '',
        destinatarioId: '',
        contenido: '',
        tipo: 'texto'
      });
    }
  }

  // Guardar cambios
  async onSaveMensaje() {
    const form = this.mensajeForm();

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
      form.markAllAsTouched();
      return;
    }

    const formValue = form.value;
    if (!formValue.contenido || formValue.contenido.trim() === '') {
      this.toastService.log('Error: El contenido del mensaje es obligatorio');
      return;
    }

    if (!formValue.destinatarioId) {
      this.toastService.log('Error: Debe seleccionar un destinatario');
      return;
    }

    this.isLoading.set(true);

    try {
      const originalData = this.mensajeData();
      const remitenteUser = this.usuarios().find(u => u.uid === formValue.remitenteId);
      const destinatarioUser = this.usuarios().find(u => u.uid === formValue.destinatarioId);

      const isCreating = this.isCreating();

      let mensajeToSave: Mensaje = {
        id: originalData?.id || `m${Date.now()}`,
        conversacionId: originalData?.conversacionId || `conv-${Date.now()}`,
        remitenteId: formValue.remitenteId,
        remitenteTipo: remitenteUser?.role || Rol.ENTRENADOR,
        destinatarioId: formValue.destinatarioId,
        destinatarioTipo: destinatarioUser?.role || Rol.ENTRENADO,
        contenido: formValue.contenido,
        tipo: formValue.tipo,
        leido: false,
        entregado: true,
        fechaEnvio: originalData?.fechaEnvio || new Date()
      };

      await this.mensajeService.save(mensajeToSave);

      // Actualizar conversación si es un mensaje nuevo
      if (isCreating) {
        await this.actualizarOCrearConversacion(
          mensajeToSave.conversacionId,
          mensajeToSave.remitenteId,
          mensajeToSave.destinatarioId,
          mensajeToSave.remitenteTipo,
          mensajeToSave.destinatarioTipo,
          mensajeToSave.contenido
        );

        // Crear notificación
        try {
          const remitenteNombre = remitenteUser?.nombre || remitenteUser?.email || 'Usuario';

          const notificacion: Notificacion = {
            id: 'notif-' + Date.now(),
            usuarioId: mensajeToSave.destinatarioId,
            tipo: TipoNotificacion.MENSAJE_NUEVO,
            titulo: 'Nuevo mensaje',
            mensaje: `${remitenteNombre} te ha enviado un mensaje`,
            leida: false,
            fechaCreacion: new Date(),
            datos: {
              mensajeId: mensajeToSave.id,
              remitenteId: mensajeToSave.remitenteId
            }
          };

          await this.notificacionService.save(notificacion);
        } catch (error) {
          console.error('Error al crear notificación:', error);
        }
      }

      let logMessage = `${isCreating ? 'Creado' : 'Actualizado'} mensaje`;
      if (remitenteUser) {
        logMessage += ` - De: ${remitenteUser.nombre || remitenteUser.email}`;
      }
      if (destinatarioUser) {
        logMessage += ` - Para: ${destinatarioUser.nombre || destinatarioUser.email}`;
      }

      this.toastService.log(logMessage);
      this.close.emit();

    } catch (error: any) {
      console.error('Error al guardar mensaje:', error);
      this.toastService.log(`ERROR al guardar mensaje: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Cerrar modal
  onClose() {
    this.close.emit();
  }

  // ========================================
  // MÉTODOS PARA CONVERSACIONES
  // ========================================

  async actualizarOCrearConversacion(
    conversacionId: string,
    remitenteId: string,
    destinatarioId: string,
    remitenteTipo: Rol,
    destinatarioTipo: Rol,
    ultimoMensaje: string
  ) {
    try {
      const conversacionExistente = this.conversacionService.conversaciones()
        .find(c => c.id === conversacionId);

      const entrenadorId = remitenteTipo === Rol.ENTRENADOR ? remitenteId : destinatarioId;
      const entrenadoId = remitenteTipo === Rol.ENTRENADO ? remitenteId : destinatarioId;

      if (conversacionExistente) {
        // Actualizar conversación existente
        await this.conversacionService.save({
          ...conversacionExistente,
          ultimoMensaje: ultimoMensaje.substring(0, 100), // Limitar longitud
          ultimoMensajeFecha: new Date(),
          fechaUltimaActividad: new Date(),
          // Incrementar contador de no leídos del destinatario
          noLeidosEntrenador: destinatarioTipo === Rol.ENTRENADOR
            ? conversacionExistente.noLeidosEntrenador + 1
            : conversacionExistente.noLeidosEntrenador,
          noLeidosEntrenado: destinatarioTipo === Rol.ENTRENADO
            ? conversacionExistente.noLeidosEntrenado + 1
            : conversacionExistente.noLeidosEntrenado
        });
      } else {
        // Crear nueva conversación
        const nuevaConversacion: Conversacion = {
          id: conversacionId,
          entrenadorId: entrenadorId,
          entrenadoId: entrenadoId,
          ultimoMensaje: ultimoMensaje.substring(0, 100),
          ultimoMensajeFecha: new Date(),
          noLeidosEntrenador: destinatarioTipo === Rol.ENTRENADOR ? 1 : 0,
          noLeidosEntrenado: destinatarioTipo === Rol.ENTRENADO ? 1 : 0,
          activa: true,
          fechaCreacion: new Date(),
          fechaUltimaActividad: new Date()
        };

        await this.conversacionService.save(nuevaConversacion);
      }
    } catch (error) {
      console.error('Error al actualizar conversación:', error);
    }
  }

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES DE MENSAJES
  // ========================================

  getNotificacionesMensajesEntrenador(entrenadorId: string): any[] {
    if (!entrenadorId) return [];

    const todasLasNotificaciones = this.notificacionService.notificaciones();

    const mensajesDelEntrenador = this.mensajes().filter(m =>
      m.destinatarioId === entrenadorId || m.remitenteId === entrenadorId
    );

    const notificacionesDelEntrenador = todasLasNotificaciones.filter((notif: Notificacion) => {
      const esParaEsteEntrenador = notif.usuarioId === entrenadorId;

      const tipoStr = String(notif.tipo).toLowerCase();
      const tituloStr = String(notif.titulo).toLowerCase();
      const esRelacionadaConMensajes =
        tipoStr.includes('mensaje') ||
        tituloStr.includes('mensaje');

      return esParaEsteEntrenador && esRelacionadaConMensajes;
    });

    return notificacionesDelEntrenador.map((notif: Notificacion) => {
      const mensajeId = notif.datos?.['mensajeId'];
      const mensajeInfo = mensajeId
        ? mensajesDelEntrenador.find(m => m.id === mensajeId)
        : mensajesDelEntrenador.find(m =>
            m.destinatarioId === entrenadorId || m.remitenteId === entrenadorId
          );

      let noLeidos = 0;
      if (mensajeInfo?.conversacionId) {
        const conversacion = this.conversacionService.conversaciones().find(c => c.id === mensajeInfo.conversacionId);
        if (conversacion) {
          const usuario = this.usuarios().find(u => u.uid === entrenadorId);
          noLeidos = usuario?.role === Rol.ENTRENADOR
            ? conversacion.noLeidosEntrenador
            : conversacion.noLeidosEntrenado;
        }
      }

      if (mensajeInfo) {
        const remitente = this.usuarios().find(u => u.uid === mensajeInfo.remitenteId);
        return {
          ...notif,
          noLeidos,
          mensajeInfo: {
            id: mensajeInfo.id,
            remitenteNombre: remitente?.nombre || remitente?.email || 'Usuario desconocido'
          }
        };
      }

      return { ...notif, noLeidos };
    });
  }

  getConversacionesEntrenador(entrenadorId: string) {
    if (!entrenadorId || entrenadorId.trim() === '') {
      return [];
    }

    // Obtener todas las conversaciones donde participa el entrenador
    const todasConversaciones = this.conversacionService.conversaciones();

    const conversaciones = todasConversaciones.filter(c => c.entrenadorId === entrenadorId);
    const resultado = conversaciones.map(conversacion => {
      // Obtener información del entrenado
      const entrenado = this.usuarios().find(u => u.uid === conversacion.entrenadoId);

      // Obtener todos los mensajes de esta conversación
      const mensajes = this.mensajeService.mensajes()
        .filter(m => m.conversacionId === conversacion.id)
        .sort((a, b) => {
          const fechaA = a.fechaEnvio instanceof Date ? a.fechaEnvio : new Date(a.fechaEnvio);
          const fechaB = b.fechaEnvio instanceof Date ? b.fechaEnvio : new Date(b.fechaEnvio);
          return fechaA.getTime() - fechaB.getTime();
        });

      return {
        id: conversacion.id,
        participantes: {
          entrenado: entrenado ? (entrenado.displayName || entrenado.nombre || 'Entrenado') : 'Entrenado',
          entrenadorId: conversacion.entrenadorId,
          entrenadoId: conversacion.entrenadoId
        },
        ultimoMensaje: conversacion.ultimoMensaje,
        ultimoMensajeFecha: conversacion.ultimoMensajeFecha,
        noLeidos: conversacion.noLeidosEntrenador,
        fechaUltimaActividad: conversacion.fechaUltimaActividad,
        mensajes: mensajes
      };
    }).sort((a, b) => {
      const fechaA = a.fechaUltimaActividad instanceof Date ? a.fechaUltimaActividad : new Date(a.fechaUltimaActividad);
      const fechaB = b.fechaUltimaActividad instanceof Date ? b.fechaUltimaActividad : new Date(b.fechaUltimaActividad);
      return fechaB.getTime() - fechaA.getTime();
    });

    return resultado;
  }

  private async marcarNotificacionesComoLeidas(mensajeId: string) {
    const notificacionesMensaje = this.notificacionService.notificaciones()
      .filter(n => n.datos?.['mensajeId'] === mensajeId && !n.leida);

    for (const notif of notificacionesMensaje) {
      await this.notificacionService.save({ ...notif, leida: true });
    }
  }

  private async decrementarNoLeidos(conversacionId: string, destinatarioId: string) {
    const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
    if (!conversacion) return;

    const destinatario = this.usuarios().find(u => u.uid === destinatarioId);
    if (!destinatario) return;

    // Decrementar el contador según el rol del destinatario
    if (destinatario.role === Rol.ENTRENADOR && conversacion.noLeidosEntrenador > 0) {
      await this.conversacionService.save({
        ...conversacion,
        noLeidosEntrenador: conversacion.noLeidosEntrenador - 1
      });
    } else if (destinatario.role === Rol.ENTRENADO && conversacion.noLeidosEntrenado > 0) {
      await this.conversacionService.save({
        ...conversacion,
        noLeidosEntrenado: conversacion.noLeidosEntrenado - 1
      });
    }
  }
}