import { Component, inject, computed, OnInit } from '@angular/core';
import { 
  IonContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonList
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, 
  documentTextOutline, 
  trendingUpOutline,
  alertCircleOutline,
  chevronForwardOutline,
  settingsOutline,
  fitnessOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { RutinaService } from '../../core/services/rutina.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    NgOptimizedImage,
    RouterLink,
    HeaderTabsComponent
  ],
})
export class GimnasioDashboardPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  private invitacionService = inject(InvitacionService);

  readonly isPremium = computed(() => this.authService.currentUser()?.plan === 'premium');

  // Estadísticas calculadas en tiempo real de Firestore con Fallback
  readonly stats = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) {
      return { totalUsers: 0, activeUsers: 0, newReports: 0, systemAlerts: 0 };
    }
  
    // 1. Filtrar los usuarios asociados a este gimnasio
    const gymUsers = this.userService.users().filter(u => u.gimnasioId === gymId);
    
    const totalUsers = gymUsers.length;
    const activeUsers = gymUsers.filter(u => u.onboarded).length;

    // 3. Obtener el número de rutinas creadas por entrenadores de este gimnasio
    const trainerIds = gymUsers.filter(u => u.role === 'entrenador').map(u => u.uid);
    const totalRoutines = this.rutinaService.rutinas().filter(r => r.creadorId && trainerIds.includes(r.creadorId)).length;

    // 4. Obtener invitaciones pendientes
    const pendingInvites = this.invitacionService.invitaciones().filter(inv => 
      inv.remitenteId === gymId && 
      inv.tipo === 'gimnasio_a_entrenador' && 
      inv.estado === 'pendiente' &&
      inv.activa
    ).length;

    return {
      totalUsers,
      activeUsers,
      newReports: totalRoutines,
      systemAlerts: pendingInvites
    };
  });

  ngOnInit() {
    // Asegurar suscripciones de Firestore
    this.userService.users();
    this.rutinaService.rutinas();
    this.invitacionService.invitaciones();
  }

  constructor() {
    addIcons({ 
      peopleOutline, 
      documentTextOutline, 
      trendingUpOutline,
      alertCircleOutline,
      chevronForwardOutline,
      settingsOutline,
      fitnessOutline
    });
  }
}

