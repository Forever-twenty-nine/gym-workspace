import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { 
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonSearchbar,
  IonListHeader
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';


@Component({
  selector: 'app-gimnasio-entrenados',
  templateUrl: 'gimnasio-entrenados.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonSearchbar,
    IonListHeader,
    NgOptimizedImage
  ],
})
export class GimnasioEntrenadosPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private entrenadoService = inject(EntrenadoService);

  readonly isPremium = computed(() => this.authService.currentUser()?.plan === 'premium');
  
  searchQuery = signal<string>('');

  // Listado de entrenados reactivo desde Firestore
  readonly filteredUsers = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    const search = this.searchQuery().toLowerCase().trim();
    if (!gymId) return [];

    let list = this.userService.users().filter(u => u.gimnasioId === gymId && u.role === 'entrenado');

    if (search) {
      list = list.filter(u => 
        (u.nombre?.toLowerCase().includes(search) || false) || 
        (u.email?.toLowerCase().includes(search) || false)
      );
    }
    return list;
  });

  // Listado de entrenados agrupados por entrenador
  readonly groupedUsers = computed(() => {
    const users = this.filteredUsers();
    const groups: { [key: string]: any[] } = {};

    for (const user of users) {
      const trainerName = this.getTraineeTrainerName(user);
      if (!groups[trainerName]) {
        groups[trainerName] = [];
      }
      groups[trainerName].push(user);
    }

    return Object.keys(groups).map(key => ({
      trainerName: key,
      users: groups[key]
    })).sort((a, b) => a.trainerName.localeCompare(b.trainerName));
  });

  /**
   * Obtiene el nombre del entrenador o entrenadores asociados a un entrenado
   */
  getTraineeTrainerName(user: any): string {
    // 1. Encontrar el perfil Entrenado
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === user.uid);
    if (!entrenado || !entrenado.entrenadoresId || entrenado.entrenadoresId.length === 0) {
      return 'Sin entrenador';
    }

    // 2. Obtener nombres de sus entrenadores de UserService
    const trainerNames = entrenado.entrenadoresId.map(trainerId => {
      const trainerUser = this.userService.users().find(u => u.uid === trainerId);
      return trainerUser?.nombre || trainerUser?.email || 'Entrenador';
    });

    return trainerNames.join(', ');
  }

  ngOnInit() {
    this.userService.users(); 
    this.entrenadoService.entrenados();
  }
}
