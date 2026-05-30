import { Component } from '@angular/core';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, 
  statsChartOutline, 
  fitnessOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-gimnasio-tabs',
  templateUrl: 'gimnasio-tabs.page.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class GimnasioTabsPage {
  constructor() {
    addIcons({ 
      peopleOutline, 
      statsChartOutline, 
      fitnessOutline 
    });
  }
}
