import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.css'],
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
    IonBadge
  ],
})
export class Tab3Page implements OnInit {
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ logOutOutline });
  }

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
   
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
  getBadgeColor(role: string): string {
    switch (role) {
      case 'gimnasio':
        return 'danger';
      case 'cliente':
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
  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'gimnasio':
        return 'Gimnasio';
      case 'cliente':
        return 'Cliente';
      case 'entrenador':
        return 'Entrenador';
      case 'user':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  }
}
