import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonButton, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-premium-upgrade-banner',
  standalone: true,
  imports: [CommonModule, IonCard, IonButton, IonText],
  templateUrl: './premium-upgrade-banner.component.html',
  styles: [`
    h3 {
      margin: 0;
    }
    .premium-button {
      --background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
      --background-hover: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
      --border-radius: 12px;
      --box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --color: #000000;
      font-weight: 900;
      margin: 0;
    }
  `]
})
export class PremiumUpgradeBannerComponent {
  upgrade = output<void>();
}
