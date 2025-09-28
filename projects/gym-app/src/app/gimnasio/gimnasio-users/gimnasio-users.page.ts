import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, createOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-gimnasio-users',
  templateUrl: 'gimnasio-users.page.html',
  styleUrls: ['gimnasio-users.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    IonSearchbar
  ],
})
export class GimnasioUsersPage {
  users = [
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', role: 'cliente', status: 'active' },
    { id: 2, name: 'María García', email: 'maria@email.com', role: 'cliente', status: 'active' },
    { id: 3, name: 'Carlos López', email: 'carlos@email.com', role: 'entrenador', status: 'active' },
    { id: 4, name: 'Ana Martínez', email: 'ana@email.com', role: 'cliente', status: 'inactive' },
    { id: 5, name: 'Luis Rodríguez', email: 'luis@email.com', role: 'entrenador', status: 'active' },
  ];

  constructor() {
    addIcons({ personOutline, createOutline, trashOutline });
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

  editUser(user: any) {
    console.log('Editar usuario:', user);
  }

  deleteUser(user: any) {
    console.log('Eliminar usuario:', user);
  }
}
