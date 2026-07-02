import {
  Component,
  inject,
  Signal,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonCard,
  NavController, IonGrid, IonCol, IonRow } from '@ionic/angular/standalone';

import { Objetivo, Plan } from 'gym-library';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaService } from '../../core/services/rutina.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { Entrenado, User as LibraryUser } from 'gym-library';
import { PlanPersonalizadoComponent } from './components/plan-personalizado/plan-personalizado.component';
import { RutinasAsignadasComponent, type DashboardRutina } from './components/rutinas-asignadas/rutinas-asignadas.component';
import { BackgroundComponent } from '../../shared/components/background/background.component';

export interface User extends LibraryUser {
  photoURL?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [IonRow, IonCol, IonGrid, 
    IonContent,
    FormsModule,
    PlanPersonalizadoComponent,
    RutinasAsignadasComponent,
    BackgroundComponent
  ],
})
export class DashboardPage {
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private invitacionService = inject(InvitacionService);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private navCtrl = inject(NavController);

  currentUserSignal = this.authService.currentUser as Signal<User | null>;

  entrenadoDataSignal = computed(() => {
    const userId = this.currentUserSignal()?.uid;
    return userId ? this.entrenadoService.getEntrenado(userId)() : null;
  });

  nombreEntrenado = computed(() => this.currentUserSignal()?.nombre || 'Entrenado');

  tieneInvitacionesPendientes = computed(() => {
    const user = this.currentUserSignal();
    if (!user?.uid) return false;
    const gymId = user.gimnasioId;
    const list = gymId 
      ? this.invitacionService.getInvitacionesForGym(gymId)() 
      : this.invitacionService.invitaciones();
    return list.some(inv => inv.entrenadoId === user.uid && inv.estado === 'pendiente');
  });

  objetivoActual = computed(() => {
    const entrenadoData = this.entrenadoDataSignal();
    if (entrenadoData?.objetivo) return entrenadoData.objetivo;
    return this.tieneInvitacionesPendientes()
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

  rutinasAsignadas = computed<DashboardRutina[]>(() => {
    const user = this.currentUserSignal();
    if (!user?.uid) return [];

    // Obtener las rutinas base del entrenado para el relleno
    const rutinas = this.rutinaService.rutinas();
    const entrenado = this.entrenadoDataSignal();
    const rutinasDelEntrenado = rutinas.filter(r => entrenado?.rutinasAsignadasIds?.includes(r.id));

    return this.rutinaAsignadaService.getProximasRutinasDashboard(user.uid, rutinasDelEntrenado)();
  });

  photoURL = computed(() => this.currentUserSignal()?.photoURL);


  entrenadorAsignado = computed(() => {
    const entrenadoresId = this.entrenadoDataSignal()?.entrenadoresId;
    if (!entrenadoresId?.length) return null;
    return (this.userService.users().find(u => u.uid === entrenadoresId[0]) as User) || null;
  });

  constructor() { }

  verRutina(rutina: { id?: string }) {
    if (rutina?.id) this.navCtrl.navigateForward(`/rutina-progreso/${rutina.id}`);
  }

  verTodasLasRutinas() {
    this.navCtrl.navigateForward('/entrenado-tabs/rutinas');
  }
}
