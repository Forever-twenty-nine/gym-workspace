import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,

  IonCardContent,
  IonAvatar, IonButtons, IonBackButton, IonChip } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personOutline,
  mailOutline,
  shieldOutline,
  timeOutline,
  checkmarkCircleOutline,
  trophyOutline,
  fitnessOutline,
  statsChartOutline
} from 'ionicons/icons';
import { UserService, AuthService, User, RutinaService, Rutina, Rol, EntrenadoService } from 'gym-library';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.css'],
  standalone: true,
  imports: [IonChip, IonBackButton, IonButtons,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,

    IonCardContent,
    IonAvatar
  ],
})
export class PerfilPage implements OnInit {
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  rutinas = signal<Rutina[]>([]);

  // Estadísticas computadas
  estadisticas = computed(() => {
    const user = this.currentUser();
    const todasRutinas = this.rutinas();

    if (!user || !todasRutinas) return null;

    // Filtrar rutinas del usuario actual
    const misRutinas = todasRutinas.filter(r =>
      r.asignadoId === user.uid || r.entrenadoId === user.uid
    );
    // Filtrar rutinas asignadas al usuario actual
    const misRutinas = todasRutinas.filter(r => {
      const entrenado = this.entrenadoService.getEntrenado(user.uid)();
      return entrenado?.rutinasAsignadas?.includes(r.id) || false;
    });

    const rutinasCompletadas = misRutinas.filter(r => r.completado).length;
    const rutinasActivas = misRutinas.filter(r => r.activa && !r.completado).length;
    const totalEjercicios = misRutinas.reduce((total, r) =>
      total + (r.ejercicios?.length || 0), 0
    const rutinasCompletadas = 0; // No hay propiedad completado
    const rutinasActivas = misRutinas.filter(r => r.activa).length;
    const totalEjercicios = misRutinas.reduce((total, r) => 
      total + (r.ejerciciosIds?.length || 0), 0
    );

    return {
      totalRutinas: misRutinas.length,
      completadas: rutinasCompletadas,
      activas: rutinasActivas,
      totalEjercicios
    };
  });

  constructor() {
    addIcons({
      logOutOutline,
      personOutline,
      mailOutline,
      shieldOutline,
      timeOutline,
      checkmarkCircleOutline,
      trophyOutline,
      fitnessOutline,
      statsChartOutline
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.rutinas.set(this.rutinaService.rutinas());
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Obtiene el color del badge según el rol del usuario
   */
  getBadgeColor(role?: string): string {
    switch (role) {
      case 'gimnasio':
        return 'danger';
      case 'entrenado':
        return 'success';
      case 'entrenador':
        return 'warning';
      case 'user':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  /**
   * Obtiene el nombre a mostrar según el rol del usuario
   */
  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'gimnasio':
        return 'Gimnasio';
      case 'entrenado':
        return 'Entrenado';
      case 'entrenador':
        return 'Entrenador';
      case 'user':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  }

  /**
   * Obtiene las iniciales del nombre
   */
  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
