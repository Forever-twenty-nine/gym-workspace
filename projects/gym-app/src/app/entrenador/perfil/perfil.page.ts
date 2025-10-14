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
import { person, trophy, checkmarkCircle, mail, star, logOutOutline, shieldOutline, personOutline, fitnessOutline } from 'ionicons/icons';
import { AuthService, UserService } from 'gym-library';
import { Rol } from 'gym-library';

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonAvatar,
    IonBadge
  ],
  styles: [`
    /* Estilos para el perfil unificado */
    .profile-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-content {
      padding: 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .profile-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .profile-info h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .info-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card-header-compact {
      padding: 12px 16px 8px;
    }

    .card-header-compact ion-card-title {
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-grid {
      display: grid;
      gap: 12px;
      padding: 8px 16px 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .info-text {
      flex: 1;
    }

    .info-label {
      display: block;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      display: block;
      font-size: 0.95rem;
      color: var(--ion-color-dark);
      font-weight: 500;
    }

    .user-id {
      font-family: monospace;
      font-size: 0.85rem;
      background: var(--ion-color-light);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .account-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .account-content {
      padding: 16px;
    }

    .account-content ion-button {
      --border-radius: 8px;
      font-weight: 600;
      height: 44px;
    }
  `]
})
export class PerfilPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = computed(() => this.authService.currentUser());

  constructor() {
    addIcons({ person, trophy, checkmarkCircle, mail, star, logOutOutline, shieldOutline, personOutline, fitnessOutline });
  }

  ngOnInit() {}

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

  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
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