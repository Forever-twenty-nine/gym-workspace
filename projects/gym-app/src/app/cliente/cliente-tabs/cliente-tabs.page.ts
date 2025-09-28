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
  fitnessOutline, 
  personOutline, statsChartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cliente-tabs',
  templateUrl: './cliente-tabs.page.html',
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
export class ClienteTabsPage {

  constructor() { 
    addIcons({statsChartOutline,fitnessOutline,personOutline});
  }
}
