import {
  Component,
  OnInit,
  inject,
  Signal,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import {
  IonContent,
  IonCard,
  ToastController,
  NavController
} from '@ionic/angular/standalone';

import { Objetivo } from 'gym-library';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaService } from '../../core/services/rutina.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { Entrenado, User as LibraryUser } from 'gym-library';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';

import { InvitacionesPendientesComponent } from './components/invitaciones-pendientes/invitaciones-pendientes.component';
import { PlanPersonalizadoComponent } from './components/plan-personalizado/plan-personalizado.component';
import { RutinasAsignadasComponent } from './components/rutinas-asignadas/rutinas-asignadas.component';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    FormsModule,
    NgOptimizedImage,
    HeaderTabsComponent,
    InvitacionesPendientesComponent,
    PlanPersonalizadoComponent,
    RutinasAsignadasComponent
  ],
})
export class DashboardPage implements OnInit {
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private toastController = inject(ToastController);
  private navCtrl = inject(NavController);

  mostrarInvitaciones = signal(true);
  currentUserSignal = this.authService.currentUser as Signal<User | null>;

  entrenadoDataSignal = computed(() => {
    const userId = this.currentUserSignal()?.uid;
    return userId ? this.entrenadoService.getEntrenado(userId)() : null;
  });

  nombreEntrenado = computed(() => this.currentUserSignal()?.nombre || 'Entrenado');

  objetivoActual = computed(() => {
    const entrenadoData = this.entrenadoDataSignal();
    if (entrenadoData?.objetivo) return entrenadoData.objetivo;
    return this.invitacionesPendientes().length > 0
      ? 'Acepta una invitación para definir tu objetivo'
      : 'Busca un entrenador para definir tu objetivo';
  });

  frecuenciaSemanal = computed(() => {
    const userId = this.currentUserSignal()?.uid;
    if (!userId) return 0;
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId)();
    return new Set(asignaciones.filter(asig => asig.diaSemana).map(asig =>
      asig.diaSemana!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )).size;
  });

  invitacionesPendientes = computed(() => {
    const userId = this.currentUserSignal()?.uid;
    if (!userId) return [];
    return this.invitacionService.invitaciones()
      .filter(inv => inv.entrenadoId === userId && inv.estado === 'pendiente')
      .map(inv => ({
        ...inv,
        titulo: `Invitación de ${inv.entrenadorNombre}`,
        mensaje: inv.mensajePersonalizado || 'Te invito a ser mi cliente.',
        datos: { entrenadorNombre: inv.entrenadorNombre }
      }));
  });

  rutinasAsignadas = computed(() => {
    const user = this.currentUserSignal();
    if (!user?.uid) return [];

    // Obtener las rutinas base del entrenado para el relleno
    const rutinas = this.rutinaService.rutinas();
    const entrenado = this.entrenadoDataSignal();
    const rutinasDelEntrenado = rutinas.filter(r => entrenado?.rutinasAsignadasIds?.includes(r.id));

    return this.rutinaAsignadaService.getProximasRutinasDashboard(user.uid, rutinasDelEntrenado)();
  });

  entrenadorAsignado = computed(() => {
    const entrenadoresId = this.entrenadoDataSignal()?.entrenadoresId;
    if (!entrenadoresId?.length) return null;
    return (this.userService.users().find(u => u.uid === entrenadoresId[0]) as User) || null;
  });

  constructor() { }

  ngOnInit() { }

  toggleInvitaciones() {
    this.mostrarInvitaciones.update(current => !current);
  }

  async aceptarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.aceptarInvitacion(invitacion.id);
      this.mostrarToast('Invitación aceptada exitosamente', 'success');
    } catch (error) {
      this.mostrarToast('Error al aceptar la invitación', 'danger');
    }
  }

  async rechazarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.rechazarInvitacion(invitacion.id);
      this.mostrarToast('Invitación rechazada', 'medium');
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
    }
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2000, color });
    await toast.present();
  }

  verRutina(rutina: any) {
    if (rutina?.id) this.navCtrl.navigateForward(`/rutina-progreso/${rutina.id}`);
  }

  verTodasLasRutinas() {
    this.navCtrl.navigateForward('/entrenado-tabs/rutinas');
  }
}
