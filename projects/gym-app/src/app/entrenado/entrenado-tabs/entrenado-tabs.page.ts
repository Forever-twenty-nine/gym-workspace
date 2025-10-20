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
  homeOutline,
  home,
  fitnessOutline,
  personOutline,
  barbellOutline,
  barbell,
  person,
  statsChartOutline,
  flameOutline,
  flame} from 'ionicons/icons';

@Component({
  selector: 'app-entrenado-tabs',
  templateUrl: './entrenado-tabs.page.html',
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
export class EntrenadoTabsPage {

  constructor() {
    addIcons({homeOutline, home, flameOutline, barbellOutline, barbell, flame, statsChartOutline,fitnessOutline,personOutline, person});
  }
}
