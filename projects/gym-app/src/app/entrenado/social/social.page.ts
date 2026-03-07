import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel
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
    SocialCardComponent,
    HeaderTabsComponent
  ],
  styleUrls: ['./social.page.css']
})
export class SocialPage {
  private sesionRutinaService = inject(SesionRutinaService);
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);

  feedSocial = this.sesionRutinaService.getSesionesCompartidas();
  selectedTab = signal<'para-ti' | 'siguiendo'>('para-ti');

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

    if (tab === 'para-ti') {
      return feed;
    } else {
      // Solo mostrar sesiones de usuarios que el entrenado actual sigue
      const seguidos = entrenado?.seguidos || [];
      return feed.filter(sesion => seguidos.includes(sesion.entrenadoId));
    }
  });

  constructor() {
    addIcons({ peopleOutline });
  }

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}

