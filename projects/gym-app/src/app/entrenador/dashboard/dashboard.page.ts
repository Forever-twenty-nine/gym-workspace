import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonAvatar,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, fitnessOutline, statsChartOutline, calendarOutline } from 'ionicons/icons';
import { AuthService } from 'gym-library';
import { EntrenadoService } from 'gym-library';
import { RutinaService } from 'gym-library';
import { EjercicioService } from 'gym-library';
import { UserService } from 'gym-library';
import { EntrenadorService } from 'gym-library';
import { Entrenado } from 'gym-library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonAvatar,
    IonChip
  ],
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private userService = inject(UserService);
  private entrenadorService = inject(EntrenadorService);

  stats = {
    entrenadosActivos: 15,
    entrenamientosHoy: 8,
    nuevosClientes: 3,
    horasEntrenamiento: 32
  };

  entrenador = computed(() => {
    const user = this.authService.currentUser();
    return user ? { nombre: user.nombre || 'Entrenador', plan: user.plan ? `Plan ${user.plan}` : 'Plan Básico' } : { nombre: 'Entrenador', plan: 'Plan Básico' };
  });

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  rutinasCreadas: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getRutinasByEntrenador(entrenadorId)() : [];
  });

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  constructor() {
    addIcons({ peopleOutline, fitnessOutline, statsChartOutline, calendarOutline });
    // Inicializar listener de entrenadores para que se listen rutinas y ejercicios creados
    this.entrenadorService.initializeListener();
  }
  ngOnInit(): void {
    // ...existing code...
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
  }

  
}
