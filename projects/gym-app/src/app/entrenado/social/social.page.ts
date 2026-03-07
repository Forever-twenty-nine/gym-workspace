import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { SocialCardComponent } from './components/social-card/social-card.component';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon, IonSegment, IonSegmentButton, IonLabel,
    IonInfiniteScroll, IonInfiniteScrollContent,
    SocialCardComponent,
    HeaderTabsComponent
  ]
})
export class SocialPage {
  private sesionRutinaService = inject(SesionRutinaService);
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);

  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  selectedTab = signal<'para-ti' | 'siguiendo'>('para-ti');
  visibleItemsCount = signal<number>(10);

  // Perfil del entrenado actual para obtener a quién sigue
  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Feed filtrado según la pestaña seleccionada
  filteredFeed = computed(() => {
    const feed = this.feedSocial();
    const tab = this.selectedTab();
    const entrenado = this.currentEntrenado();

    let result = [];
    if (tab === 'para-ti') {
      result = feed;
    } else {
      // Solo mostrar sesiones de usuarios que el entrenado actual sigue
      const seguidos = entrenado?.seguidos || [];
      result = feed.filter(sesion => seguidos.includes(sesion.entrenadoId));
    }

    // Aplicar límite para scroll infinito
    return result.slice(0, this.visibleItemsCount());
  });

  // Indica si hay más items para cargar
  hasMoreItems = computed(() => {
    const feed = this.feedSocial();
    const tab = this.selectedTab();
    const entrenado = this.currentEntrenado();

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
    addIcons({ peopleOutline });
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
}

