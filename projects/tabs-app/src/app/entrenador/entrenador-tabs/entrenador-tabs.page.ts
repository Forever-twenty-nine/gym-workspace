import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline, 
  peopleOutline, 
  personOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-entrenador-tabs',
  templateUrl: './entrenador-tabs.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ]
})
export class EntrenadorTabsPage {

  constructor() { 
    addIcons({
      statsChartOutline,
      peopleOutline,
      personOutline
    });
  }
}
