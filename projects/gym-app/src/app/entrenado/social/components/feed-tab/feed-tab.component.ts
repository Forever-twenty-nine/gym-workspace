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
import { DesafioService } from '../../../../core/services/desafio.service';
import { UserService } from '../../../../core/services/user.service';
import { SocialCardComponent } from '../social-card/social-card.component';
import { DesafioFeedCardComponent } from '../desafio-feed-card/desafio-feed-card.component';

@Component({
  selector: 'app-feed-tab',
  templateUrl: './feed-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonIcon,
    SocialCardComponent,
    DesafioFeedCardComponent
  ]
})
export class FeedTabComponent {
  private sesionRutinaService = inject(SesionRutinaService);
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private desafioService = inject(DesafioService);
  private userService = inject(UserService);

  private readonly _tab = signal<'para-ti' | 'siguiendo'>('para-ti');
  @Input() set tab(value: 'para-ti' | 'siguiendo') {
    this._tab.set(value);
    this.visibleItemsCount.set(10); // Resetear al cambiar de pestaña
  }
  get tab() { return this._tab(); }

  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  visibleItemsCount = signal<number>(10);
  desafiosOcultados = signal<string[]>([]);

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  desafiosActivos = this.desafioService.desafios;

  // Feed de la comunidad completo (sin paginar) filtrado por gimnasio
  allGymFeed = computed<any[]>(() => {
    const feed = this.feedSocial();
    const tab = this._tab();
    const entrenado = this.currentEntrenado();
    const activeDesafios = this.desafiosActivos();
    const ocultados = this.desafiosOcultados();
    const currentUserGymId = this.authService.currentUser()?.gimnasioId;

    let result = [];
    if (tab === 'para-ti') {
      const currentUserId = this.authService.currentUser()?.uid;
      
      // Filtrar desafíos del mismo gimnasio (que no sean propios ni ocultados)
      const filteredDesafios = activeDesafios
        .filter(d => {
          if (d.creadorId === currentUserId) return false;
          if (ocultados.includes(d.id)) return false;
          const creatorProfile = this.userService.getUserByUid(d.creadorId)();
          return creatorProfile?.gimnasioId === currentUserGymId;
        })
        .map(d => ({ 
          ...d, 
          isDesafio: true, 
          fechaOrden: d.fechaCreacion instanceof Date ? d.fechaCreacion : new Date(d.fechaCreacion)
        }));

      // Sesiones compartidas de la comunidad del mismo gimnasio
      const mappedFeed = feed
        .filter(s => {
          const posterProfile = this.userService.getUserByUid(s.entrenadoId)();
          return posterProfile?.gimnasioId === currentUserGymId;
        })
        .map(s => ({ 
          ...s, 
          isDesafio: false, 
          fechaOrden: s.fechaCompartida ? (s.fechaCompartida.toDate ? s.fechaCompartida.toDate() : new Date(s.fechaCompartida)) : new Date() 
        }));

      // Mezclar desafíos y sesiones compartidas ordenando por fecha de creación/compartido
      result = [...filteredDesafios, ...mappedFeed].sort((a, b) => b.fechaOrden.getTime() - a.fechaOrden.getTime());
    } else if (tab === 'siguiendo') {
      const seguidos = entrenado?.seguidos || [];
      result = feed
        .filter(sesion => {
          if (!seguidos.includes(sesion.entrenadoId)) return false;
          const posterProfile = this.userService.getUserByUid(sesion.entrenadoId)();
          return posterProfile?.gimnasioId === currentUserGymId;
        })
        .map(s => ({
          ...s,
          isDesafio: false,
          fechaOrden: s.fechaCompartida ? (s.fechaCompartida.toDate ? s.fechaCompartida.toDate() : new Date(s.fechaCompartida)) : new Date() 
        }));
    } else {
      return [];
    }

    return result;
  });

  // Feed filtrado y paginado según la pestaña seleccionada
  filteredFeed = computed<any[]>(() => {
    return this.allGymFeed().slice(0, this.visibleItemsCount());
  });

  // Indica si hay más items para cargar
  hasMoreItems = computed(() => {
    return this.visibleItemsCount() < this.allGymFeed().length;
  });

  constructor() {
    addIcons({ peopleOutline });
  }

  async loadMore(event: any) {
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    this.visibleItemsCount.update(count => count + 10);
    event.target.complete();

    if (!this.hasMoreItems()) {
      event.target.disabled = true;
    }
  }

  dismissDesafio(id: string, action: 'accept' | 'pass') {
    this.desafiosOcultados.update(list => [...list, id]);
  }
}
