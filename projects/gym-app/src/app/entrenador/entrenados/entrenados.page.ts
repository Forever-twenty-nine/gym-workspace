import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  IonModal,
  IonAvatar,
  IonPopover
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, close, person, trophy, checkmarkCircle, calendar, business } from 'ionicons/icons';
import { AuthService } from 'gym-library';
import { EntrenadoService } from 'gym-library';
import { UserService } from 'gym-library';
import { Entrenado } from 'gym-library';

@Component({
  selector: 'app-entrenados',
  templateUrl: './entrenados.page.html',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
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
    IonPopover
  ],
  styles: [`
    .entrenado-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .avatar-section {
      text-align: center;
    }

    .large-avatar {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
    }

    .entrenado-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin: 0;
    }

    .detail-list {
      width: 100%;
      background: transparent;
    }

    .detail-list ion-item {
      --border-radius: 12px;
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .detail-list ion-icon {
      font-size: 24px;
    }

    .entrenado-popover {
      --width: 100%;
      --max-width: 400px;
      --border-radius: 16px;
      --backdrop-opacity: 0.3;
    }
  `]
})
export class EntrenadosPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);

  isModalOpen = signal(false);
  selectedEntrenado = signal<Entrenado | null>(null);

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadorId === entrenadorId) : [];
  });

  constructor() {
    addIcons({ peopleOutline, close, person, trophy, checkmarkCircle, calendar, business });
  }

  ngOnInit() {
    // Inicializar si es necesario
  }

  verCliente(entrenado: Entrenado) {
    this.selectedEntrenado.set(entrenado);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEntrenado.set(null);
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
  }
}