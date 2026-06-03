import { Component, inject, signal, computed } from '@angular/core';
import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { ConvocatoriasComponent } from './components/convocatorias/convocatorias.component';
import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { FeedTabComponent } from './components/feed-tab/feed-tab.component';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    NgOptimizedImage,
    IonSegment, IonSegmentButton, IonLabel,
    HeaderTabsComponent,
    ConvocatoriasComponent,
    DescubrirTabComponent,
    FeedTabComponent
  ]
})
export class SocialPage {
  private authService = inject(AuthService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir' | 'activar-hoy'>('para-ti');

  constructor() {}

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
