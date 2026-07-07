import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-stats-teaser',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonCard, IonCardContent, IonCardTitle],
  templateUrl: './profile-stats-teaser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileStatsTeaserComponent {
  viewPlansClick = output<void>();
}
