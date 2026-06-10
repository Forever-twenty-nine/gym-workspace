import { Component, inject, computed, signal, input, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonIcon, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonChip, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person } from 'ionicons/icons';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserService } from '../../../../../core/services/user.service';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [IonCardSubtitle, 
    CommonModule, IonCard, IonIcon,
    IonCardHeader, IonCardContent, IonCardTitle, IonChip, IonLabel
  ],
  templateUrl: './match-card.component.html'
})
export class MatchCardComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  tipo = input.required<'afinidad' | 'horario' | 'general'>();
  data = input.required<any>();
  photoURL = input<string | null>(null); 
  photoVersion = input<number>(0); 

  currentUser = this.authService.currentUser;
  
  photoFailed = signal<boolean>(false);

  userName = computed(() => {
    const data = this.data();
    if (!data) return 'Atleta';
    return data.id ? this.userService.getUserByUid(data.id)()?.nombre || 'Atleta' : 'Atleta';
  });

  private readonly resolvedUser = computed(() => {
    const id = this.data()?.id;
    if (!id) return null;
    return this.userService.getUserByUid(id)();
  });

  userProfilePhoto = computed(() => {
    const data = this.data();
    const inputUrl = this.photoURL();
    const version = this.photoVersion();

    if (!data) return null;

    let url: string | null = null;
    
    // Prioridad 1: URL pasada por input directo
    if (inputUrl !== null) {
      url = inputUrl || null;
    } 
    // Prioridad 2: URL dentro del objeto data
    else if (data.photoURL != null) {
      url = data.photoURL || null;
    } 
    // Prioridad 3: URL resuelta desde el servicio de usuario
    else {
      const user = this.resolvedUser();
      url = user?.photoURL || null;
    }

    // Bust cache if version is provided and > 0
    if (url && version > 0) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}v=${version}`;
    }

    return url;
  });

  safePhoto = computed(() => {
    if (this.photoFailed()) return null;
    return this.userProfilePhoto();
  });

  matchReasons = computed(() => {
    const data = this.data();
    const external = data?.matchReasons;
    if (external && Array.isArray(external) && external.length) return external;

    if (this.tipo() === 'horario') return ['Coincide contigo en tu horario'];
    if (this.tipo() === 'afinidad') return ['Coincide contigo en tu objetivo'];
    return [];
  });

  onPhotoError(): void {
    this.photoFailed.set(true);
  }

  constructor() {
    addIcons({ person });

    // Rerestablecer el estado de error de la foto cuando cambie la fuente
    effect(() => {
      this.userProfilePhoto();
      untracked(() => this.photoFailed.set(false));
    });
  }
}
