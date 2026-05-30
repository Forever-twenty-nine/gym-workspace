import { Component, inject, signal, computed } from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonBadge
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { addIcons } from 'ionicons';
import { peopleOutline, timeOutline, trophyOutline, sparklesOutline, closeOutline, checkmarkOutline, barbellOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { SocialCardComponent } from './components/social-card/social-card.component';
import { MatchCardComponent } from './components/match-card/match-card.component';
import { DesafioFeedCardComponent } from './components/desafio-feed-card/desafio-feed-card.component';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { MatchService } from '../../core/services/match.service';
import { DesafioService } from '../../core/services/desafio.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    NgOptimizedImage,
    IonIcon, IonSegment, IonSegmentButton, IonLabel,
    IonInfiniteScroll, IonInfiniteScrollContent, IonBadge,
    SocialCardComponent,
    MatchCardComponent,
    DesafioFeedCardComponent,
    HeaderTabsComponent
  ]
})
export class SocialPage {
  private sesionRutinaService = inject(SesionRutinaService);
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private matchService = inject(MatchService);
  private desafioService = inject(DesafioService);
  private userService = inject(UserService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir' | 'activar-hoy'>('para-ti');
  visibleItemsCount = signal<number>(10);

  // Estados locales para interacciones rápidas
  desafiosOcultados = signal<string[]>([]);
  usuariosInteractuadosHoy = signal<string[]>([]);

  // Perfil del entrenado actual
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Sugerencias sociales calculadas reactivamente
  sugerenciasHorario = computed(() => {
    const curr = this.currentEntrenado();
    return curr ? this.matchService.getSugerenciasHorario(curr)() : [];
  });

  sugerenciasAfinidad = computed(() => {
    const curr = this.currentEntrenado();
    return curr ? this.matchService.getSugerenciasAfinidad(curr)() : [];
  });

  desafiosActivos = this.desafioService.desafios;

  // Sugerencias de disponibilidad horaria filtrando las ya interactuadas
  sugerenciasDisponibilidad = computed(() => {
    const list = this.sugerenciasHorario();
    const interactuados = this.usuariosInteractuadosHoy();
    return list.filter(user => !interactuados.includes(user.id));
  });

  // Feed filtrado según la pestaña seleccionada
  filteredFeed = computed<any[]>(() => {
    const feed = this.feedSocial();
    const tab = this.selectedTab();
    const entrenado = this.currentEntrenado();
    const activeDesafios = this.desafiosActivos();
    const ocultados = this.desafiosOcultados();

    let result = [];
    if (tab === 'para-ti') {
      const currentUserId = this.authService.currentUser()?.uid;
      
      // Filtrar desafíos activos que no sean del propio usuario y que no hayan sido ocultados por swipe
      const filteredDesafios = activeDesafios
        .filter(d => d.creadorId !== currentUserId && !ocultados.includes(d.id))
        .map(d => ({ 
          ...d, 
          isDesafio: true, 
          fechaOrden: d.fechaCreacion instanceof Date ? d.fechaCreacion : new Date(d.fechaCreacion)
        }));

      // Sesiones compartidas de la comunidad
      const mappedFeed = feed.map(s => ({ 
        ...s, 
        isDesafio: false, 
        fechaOrden: s.fechaCompartida ? (s.fechaCompartida.toDate ? s.fechaCompartida.toDate() : new Date(s.fechaCompartida)) : new Date() 
      }));

      // Mezclar desafíos y sesiones compartidas ordenando por fecha de creación/compartido
      result = [...filteredDesafios, ...mappedFeed].sort((a, b) => b.fechaOrden.getTime() - a.fechaOrden.getTime());
    } else if (tab === 'siguiendo') {
      const seguidos = entrenado?.seguidos || [];
      result = feed.filter(sesion => seguidos.includes(sesion.entrenadoId));
    } else {
      return [];
    }

    return result.slice(0, this.visibleItemsCount());
  });

  // Indica si hay más items para cargar
  hasMoreItems = computed(() => {
    const feed = this.feedSocial();
    const tab = this.selectedTab();
    const entrenado = this.currentEntrenado();

    if (tab === 'descubrir' || tab === 'activar-hoy') return false;

    let totalItems = 0;
    if (tab === 'para-ti') {
      totalItems = feed.length;
    } else {
      const seguidos = entrenado?.seguidos || [];
      totalItems = feed.filter(sesion => seguidos.includes(sesion.entrenadoId)).length;
    }

    return this.visibleItemsCount() < totalItems;
  });

  constructor() {
    addIcons({ 
      peopleOutline, timeOutline, trophyOutline, sparklesOutline,
      closeOutline, checkmarkOutline, barbellOutline, chatbubblesOutline, personOutline 
    });
  }

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
    this.visibleItemsCount.set(10); // Resetear al cambiar de pestaña
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

  async conectarUsuario(userId: string) {
    const user = this.currentUserSignal();
    if (!user) return;
    this.usuariosInteractuadosHoy.update(list => [...list, userId]);
    
    try {
      await this.matchService.registrarInteres(user.uid, userId, 'horario');
    } catch (e) {
      console.error('Error al registrar interes horaria:', e);
    }
  }

  pasarUsuario(userId: string) {
    this.usuariosInteractuadosHoy.update(list => [...list, userId]);
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }
}

