import { Component } from '@angular/core';
import { IonContent, IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline } from 'ionicons/icons';
import { BackgroundComponent } from '../../shared/components/background/background.component';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    BackgroundComponent
  ],
})
export class GimnasioDashboardPage {
  constructor() {
    addIcons({ barChartOutline });
  }
}