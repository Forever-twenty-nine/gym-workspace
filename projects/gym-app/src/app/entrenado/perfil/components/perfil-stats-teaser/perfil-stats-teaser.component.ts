import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil-stats-teaser',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonCard, IonCardContent, IonCardTitle],
  templateUrl: './perfil-stats-teaser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilStatsTeaserComponent {
  viewPlansClick = output<void>();
}
