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
  settingsOutline, 
  peopleOutline, 
  statsChartOutline, 
  personOutline 
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
      settingsOutline, 
      peopleOutline, 
      statsChartOutline, 
      personOutline 
    });
  }
}
