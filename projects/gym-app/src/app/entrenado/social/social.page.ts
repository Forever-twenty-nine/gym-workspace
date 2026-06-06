import { Component, inject, signal, computed } from '@angular/core';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonHeader } from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

import { ConvocatoriasComponent } from './components/convocatorias/convocatorias.component';
import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { FeedTabComponent } from './components/feed-tab/feed-tab.component';
import { DesafioFeedCardComponent } from './components/desafio-feed-card/desafio-feed-card.component';
import { DesafioService } from '../../core/services/desafio.service';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    NgOptimizedImage,
    IonSegment, IonSegmentButton, IonLabel,
    ConvocatoriasComponent,
    DescubrirTabComponent,
    FeedTabComponent,
    DesafioFeedCardComponent,
    IonHeader
]
})
export class SocialPage {
  private authService = inject(AuthService);
  private desafioService = inject(DesafioService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir'>('para-ti');

  desafiosActivos = computed(() => {
    const gimnasioId = this.currentUserSignal()?.gimnasioId;
    if (!gimnasioId) return [];
    return this.desafioService.getDesafiosByGimnasio(gimnasioId)();
  });

  constructor() {
    addIcons({ trophyOutline });
  }

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
