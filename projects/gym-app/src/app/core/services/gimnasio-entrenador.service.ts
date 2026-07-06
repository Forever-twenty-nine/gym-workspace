import { Injectable, computed, inject } from '@angular/core';
import { UserService } from './user.service';
import { EntrenadoService } from './entrenado.service';
import { InvitacionService } from './invitacion.service';
import { GimnasioService } from './gimnasio.service';
import { EntrenadorService } from './entrenador.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GimnasioEntrenadorService {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private gimnasioService = inject(GimnasioService);
  private entrenadorService = inject(EntrenadorService);
  private entrenadoService = inject(EntrenadoService);
  private invitacionService = inject(InvitacionService);

  readonly entrenadoresAsociados = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return [];
    
    const trainees = this.entrenadoService.entrenados();
    return this.userService.users()
      .filter(u => u.gimnasioId === gymId && u.role === 'entrenador')
      .map(u => {
        const count = trainees.filter(e => e.entrenadoresId?.includes(u.uid)).length;
        return {
          ...u,
          cantidadEntrenados: count
        };
      });
  });

  readonly invitacionesPendientes = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return [];
    return this.invitacionService.invitaciones().filter(inv => 
      inv.remitenteId === gymId && 
      inv.tipo === 'gimnasio_a_entrenador' && 
      inv.estado === 'pendiente' &&
      inv.activa
    );
  });

  inicializarColecciones() {
    this.userService.users(); 
    this.invitacionService.invitaciones;
    this.gimnasioService.gimnasios;
    this.entrenadorService.entrenadores;
    this.entrenadoService.entrenados();
  }

  async enviarInvitacion(email: string, mensaje: string): Promise<void> {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) {
      throw new Error('Error: No se pudo identificar la cuenta de gimnasio activa');
    }

    const emailToSearch = email?.trim();
    if (!emailToSearch) {
      throw new Error('Error: Introduce un email válido');
    }

    if (emailToSearch.toLowerCase() === this.authService.currentUser()?.email?.toLowerCase()) {
      throw new Error('No puedes enviarte una invitación a ti mismo');
    }

    const usuarioInvitado = await this.userService.getUserByEmailAsync(emailToSearch);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId || !usuarioInvitado?.email) {
      throw new Error(`Error: No se encontró un usuario con el email ${emailToSearch}`);
    }

    if (usuarioInvitado.role !== 'entrenador') {
      throw new Error('Error: El usuario con ese email no es un entrenador registrado');
    }

    if (usuarioInvitado.gimnasioId === gymId) {
      throw new Error('El entrenador ya se encuentra vinculado a tu gimnasio');
    }

    const yaInvitado = this.invitacionesPendientes().some(inv => inv.emailDestinatario?.toLowerCase() === emailToSearch.toLowerCase());
    if (yaInvitado) {
      throw new Error('Ya has enviado una invitación pendiente a este entrenador');
    }

    const gymActual = this.userService.users().find(u => u.uid === gymId);
    const gymNombre = gymActual?.nombre || gymActual?.email || 'Gimnasio';
    const entrenadorNombre = usuarioInvitado.nombre || usuarioInvitado.email || 'Entrenador';
    const emailEntrenador = usuarioInvitado.email;

    await this.invitacionService.crearInvitacion(
      gymId,
      usuarioId,
      gymNombre,
      entrenadorNombre,
      emailEntrenador,
      mensaje || '',
      'gimnasio_a_entrenador'
    );
  }

  async cancelarInvitacion(invitacionId: string): Promise<void> {
    await this.invitacionService.delete(invitacionId);
  }

  async desvincularEntrenador(user: any): Promise<void> {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return;

    // 1. Actualizar usuario
    await this.userService.updateUser(user.uid, { gimnasioId: null } as any);
    
    // 2. Actualizar perfil Entrenador
    await this.entrenadorService.update(user.uid, { gimnasioId: null } as any);

    // 3. Actualizar perfil Gimnasio
    const gym = this.gimnasioService.getGimnasioById(gymId)();
    if (gym) {
      const entrenadoresIds = (gym.entrenadoresIds || []).filter(id => id !== user.uid);
      await this.gimnasioService.save({ ...gym, entrenadoresIds });
    }
  }
}
