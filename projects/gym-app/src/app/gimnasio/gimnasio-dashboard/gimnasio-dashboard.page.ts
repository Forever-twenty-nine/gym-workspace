import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { 
  IonContent,
  ToastController
} from '@ionic/angular/standalone';
import { Plan } from 'gym-library';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { RutinaService } from '../../core/services/rutina.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { GymActivationRingComponent } from './components/gym-activation-ring/gym-activation-ring.component';
import { GymTrainerStatsComponent } from './components/gym-trainer-stats/gym-trainer-stats.component';
import { GymTraineeStatsComponent } from './components/gym-trainee-stats/gym-trainee-stats.component';
import { LevelDistributionChartComponent } from './components/level-distribution-chart/level-distribution-chart.component';
import { ObjectiveDistributionChartComponent } from './components/objective-distribution-chart/objective-distribution-chart.component';
import { PremiumUpgradeBannerComponent } from './components/premium-upgrade-banner/premium-upgrade-banner.component';
import { BackgroundComponent } from '../../shared/components/background/background.component';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    GymActivationRingComponent,
    GymTrainerStatsComponent,
    GymTraineeStatsComponent,
    LevelDistributionChartComponent,
    ObjectiveDistributionChartComponent,
    PremiumUpgradeBannerComponent,
    BackgroundComponent
  ],
})
export class GimnasioDashboardPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  private invitacionService = inject(InvitacionService);
  private entrenadorService = inject(EntrenadorService);
  private entrenadoService = inject(EntrenadoService);
  private toastController = inject(ToastController);

  readonly isPremium = computed(() => this.authService.currentUser()?.plan === Plan.PREMIUM);
  readonly Math = Math;
  readonly selectedSegment = signal<'entrenadores' | 'entrenados'>('entrenadores');

  // Estadísticas completas de Firestore para el gimnasio
  readonly stats = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        activationRate: 0,
        
        // Entrenadores
        totalTrainers: 0,
        activeTrainers: 0,
        avgTraineesPerTrainer: 0,
        routinesCreatedByTrainers: 0,
        pendingInvitations: 0,
        
        // Entrenados
        totalTrainees: 0,
        activeTrainees: 0,
        traineesWithoutTrainer: 0,
        
        // Desglose Nivel
        levelNovatoPrincipiante: 0,
        levelIntermedio: 0,
        levelAvanzadoExperto: 0,
        
        // Desglose Objetivo
        objSalud: 0,
        objVolumen: 0,
        objDefinicion: 0,
        objFuerza: 0
      };
    }
  
    // 1. Filtrar los usuarios asociados a este gimnasio
    const gymUsers = this.userService.users().filter(u => u.gimnasioId === gymId);
    
    const totalUsers = gymUsers.length;
    const activeUsers = gymUsers.filter(u => u.onboarded).length;
    const activationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // 2. Filtrar Entrenadores
    const trainers = gymUsers.filter(u => u.role === 'entrenador');
    const totalTrainers = trainers.length;
    const activeTrainers = trainers.filter(t => t.onboarded).length;
    const trainerIds = trainers.map(t => t.uid);

    const trainerProfiles = this.entrenadorService.entrenadores();
    const gymTrainerProfiles = trainerProfiles.filter(tp => trainerIds.includes(tp.id));
    
    // Promedio de entrenados por entrenador
    const totalAssignedTrainees = gymTrainerProfiles.reduce((acc, tp) => acc + (tp.entrenadosAsignadosIds?.length || 0), 0);
    const avgTraineesPerTrainer = totalTrainers > 0 ? parseFloat((totalAssignedTrainees / totalTrainers).toFixed(1)) : 0;

    // Obtener el número de rutinas creadas por entrenadores de este gimnasio
    const routinesCreatedByTrainers = this.rutinaService.rutinas().filter(r => r.creadorId && trainerIds.includes(r.creadorId)).length;

    // Obtener invitaciones pendientes
    const pendingInvitations = this.invitacionService.invitaciones().filter(inv => 
      inv.remitenteId === gymId && 
      inv.tipo === 'gimnasio_a_entrenador' && 
      inv.estado === 'pendiente' &&
      inv.activa
    ).length;

    // 3. Filtrar Entrenados
    const trainees = gymUsers.filter(u => u.role === 'entrenado');
    const totalTrainees = trainees.length;
    const activeTrainees = trainees.filter(t => t.onboarded).length;
    const traineeIds = trainees.map(t => t.uid);

    const traineeProfiles = this.entrenadoService.entrenados();
    const gymTraineeProfiles = traineeProfiles.filter(tp => traineeIds.includes(tp.id));

    // Entrenados sin entrenador
    const traineesWithoutTrainer = gymTraineeProfiles.filter(tp => !tp.entrenadoresId || tp.entrenadoresId.length === 0).length;

    // Desgloses por Nivel
    let levelNovatoPrincipiante = 0;
    let levelIntermedio = 0;
    let levelAvanzadoExperto = 0;

    // Desgloses por Objetivo
    let objSalud = 0;
    let objVolumen = 0;
    let objDefinicion = 0;
    let objFuerza = 0;

    gymTraineeProfiles.forEach(tp => {
      const lvl = tp.nivel?.toLowerCase();
      if (lvl === 'novato' || lvl === 'principiante') {
        levelNovatoPrincipiante++;
      } else if (lvl === 'intermedio') {
        levelIntermedio++;
      } else if (lvl === 'avanzado' || lvl === 'experto') {
        levelAvanzadoExperto++;
      }

      const obj = tp.objetivo?.toLowerCase();
      if (obj === 'salud') {
        objSalud++;
      } else if (obj === 'volumen') {
        objVolumen++;
      } else if (obj === 'definicion') {
        objDefinicion++;
      } else if (obj === 'fuerza') {
        objFuerza++;
      }
    });

    return {
      totalUsers,
      activeUsers,
      activationRate,
      
      // Entrenadores
      totalTrainers,
      activeTrainers,
      avgTraineesPerTrainer,
      routinesCreatedByTrainers,
      pendingInvitations,
      
      // Entrenados
      totalTrainees,
      activeTrainees,
      traineesWithoutTrainer,
      
      // Desglose Nivel
      levelNovatoPrincipiante,
      levelIntermedio,
      levelAvanzadoExperto,
      
      // Desglose Objetivo
      objSalud,
      objVolumen,
      objDefinicion,
      objFuerza
    };
  });

  ngOnInit() {
    // Asegurar suscripciones de Firestore
    this.userService.users();
    this.rutinaService.rutinas();
    this.invitacionService.invitaciones();
    this.entrenadorService.initializeListener();
    this.entrenadoService.initializeListener();
  }

  async mejorarPlan() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      try {
        await this.userService.updateUser(uid, { plan: Plan.PREMIUM });
        const toast = await this.toastController.create({
          message: '¡Plan actualizado a Premium con éxito! Disfruta de tus estadísticas.',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      } catch (error) {
        console.error('Error al actualizar plan:', error);
        const toast = await this.toastController.create({
          message: 'Hubo un error al actualizar el plan. Intenta nuevamente.',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    }
  }


}

