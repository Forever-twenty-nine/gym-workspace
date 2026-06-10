import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { UserService } from '../../../../core/services/user.service';
import { SocialCardComponent } from './social-card/social-card.component';
import { SesionRutina } from 'gym-library';

@Component({
  selector: 'app-feed-tab',
  templateUrl: './feed-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonIcon,
    SocialCardComponent
  ]
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

  // No pasamos gymId aquí: el servicio trae TODAS las sesiones compartidas
  // (incluyendo legacy sin gimnasioId). El filtrado por gym y "siguiendo"
  // se hace client-side en allGymFeed() para no perder datos antiguos.
  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  visibleItemsCount = signal<number>(10);

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Feed de la comunidad completo (solo sesiones compartidas, limpio)
  // Los desafíos y convocatorias ahora viven en las barras de stories arriba
  //
  // Filtrado por gimnasio + exclusión de propias en "Para ti" se hace aquí (client-side).
  // Esto permite ver publicaciones legacy (sin gimnasioId en el doc) mientras que
  // las nuevas guardan gimnasioId al compartirse.
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
}
