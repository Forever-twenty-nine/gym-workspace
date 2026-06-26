import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent, 
  IonCardSubtitle, 
  IonImg,
  IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { SesionRutinaService } from '../../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { EntrenadoService } from '../../../../../core/services/entrenado.service';
import { UserService } from '../../../../../core/services/user.service';
import { SocialCardComponent } from './social-card/social-card.component';
import { SesionRutina } from 'gym-library';

@Component({
  selector: 'app-feed-tab',
  templateUrl: './feed-tab.component.html',
  standalone: true,
  imports: [IonImg, IonCardSubtitle,
    CommonModule,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    SocialCardComponent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonImg,
    IonSpinner]
})
export class FeedTabComponent {
  private sesionRutinaService = inject(SesionRutinaService);
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);

  private readonly _tab = signal<'para-ti' | 'siguiendo'>('para-ti');
  @Input() set tab(value: 'para-ti' | 'siguiendo') {
    this._tab.set(value);
    this.visibleItemsCount.set(10); // Resetear al cambiar de pestaña
  }
  get tab() { return this._tab(); }

  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  visibleItemsCount = signal<number>(10);

  isLoading = computed(() => {
    return this.sesionRutinaService.isLoadingCompartidas() || 
           !this.currentEntrenado() || 
           this.userService.users().length === 0;
  });

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  allGymFeed = computed<(SesionRutina & { fechaOrden: Date })[]>(() => {
    const feed = this.feedSocial();
    const tab = this._tab();
    const entrenado = this.currentEntrenado();
    const currentUserGymId = this.authService.currentUser()?.gimnasioId;

    if (tab === 'para-ti') {
      const currentUserId = this.authService.currentUser()?.uid;
      return feed
        .filter(s => {
          if (s.entrenadoId === currentUserId) return false; // excluir propias en "Para ti"
          const posterProfile = this.userService.getUserByUid(s.entrenadoId)();
          return posterProfile?.gimnasioId === currentUserGymId;
        })
        .map(s => (Object.assign({}, s, {
          fechaOrden: s.fechaCompartida ? (s.fechaCompartida.toDate ? s.fechaCompartida.toDate() : new Date(s.fechaCompartida)) : new Date()
        }) as SesionRutina & { fechaOrden: Date }))
        .sort((a, b) => b.fechaOrden.getTime() - a.fechaOrden.getTime());
    } else if (tab === 'siguiendo') {
      const seguidos = entrenado?.seguidos || [];
      return feed
        .filter(sesion => {
          if (!seguidos.includes(sesion.entrenadoId)) return false;
          const posterProfile = this.userService.getUserByUid(sesion.entrenadoId)();
          return posterProfile?.gimnasioId === currentUserGymId;
        })
        .map(s => (Object.assign({}, s, {
          fechaOrden: s.fechaCompartida ? (s.fechaCompartida.toDate ? s.fechaCompartida.toDate() : new Date(s.fechaCompartida)) : new Date()
        }) as SesionRutina & { fechaOrden: Date }))
        .sort((a, b) => b.fechaOrden.getTime() - a.fechaOrden.getTime());
    }

    return [];
  });

  // Feed filtrado y paginado según la pestaña seleccionada
  filteredFeed = computed<(SesionRutina & { fechaOrden: Date })[]>(() => {
    return this.allGymFeed().slice(0, this.visibleItemsCount());
  });

  // Indica si hay más items para cargar
  hasMoreItems = computed(() => {
    return this.visibleItemsCount() < this.allGymFeed().length;
  });

  constructor() {
    addIcons({ peopleOutline });
  }

  async loadMore(event: { target?: { complete: () => void; disabled?: boolean } }) {
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    this.visibleItemsCount.update(count => count + 10);
    event.target?.complete?.();

    if (!this.hasMoreItems()) {
      if (event.target) (event.target as any).disabled = true;
    }
  }
  async navigateToRutina(rutinaId: string) {
    // Aquí puedes implementar la navegación a la página de detalles de la rutina
    console.log('Navegar a rutina con ID:', rutinaId);
  }
}
