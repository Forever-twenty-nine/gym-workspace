import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';
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
  IonAvatar,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, trophy, checkmarkCircle, mail, star, logOutOutline } from 'ionicons/icons';
import { AuthService, UserService, EntrenadoService } from 'gym-library';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonAvatar,
    IonBadge
  ],
  styles: [`
    .perfil-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }

    .avatar-section {
      text-align: center;
    }

    .large-avatar {
      width: 100px;
      height: 100px;
      margin: 0 auto 15px;
      border: 3px solid var(--ion-color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .perfil-name {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--ion-color-primary);
      margin: 0;
      text-align: center;
    }

    .detail-list {
      width: 100%;
      background: transparent;
      margin-top: 10px;
    }

    .detail-list ion-item {
      --border-radius: 12px;
      margin-bottom: 8px;
      --background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .logout-button {
      margin-top: 30px;
      --border-radius: 12px;
      font-weight: 600;
      height: 50px;
    }

    .stats-section {
      width: 100%;
      display: flex;
      justify-content: space-around;
      gap: 15px;
      margin: 20px 0;
    }

    .stat-card {
      flex: 1;
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      display: block;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      font-weight: 500;
    }
  `]
})
export class PerfilPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);

  currentUser = computed(() => this.authService.currentUser());

  entrenadosCount: Signal<number> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadorId === entrenadorId).length : 0;
  });

  constructor() {
    addIcons({ person, trophy, checkmarkCircle, mail, star, logOutOutline });
  }

  ngOnInit() {}

  getBadgeColor(role: string): string {
    switch (role) {
      case 'entrenador': return 'primary';
      case 'admin': return 'danger';
      default: return 'medium';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'entrenador': return 'Entrenador';
      case 'admin': return 'Administrador';
      default: return 'Usuario';
    }
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
}