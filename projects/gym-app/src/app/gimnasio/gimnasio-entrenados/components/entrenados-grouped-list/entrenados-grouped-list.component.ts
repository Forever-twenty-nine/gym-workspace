import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonListHeader, 
  IonText 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-entrenados-grouped-list',
  standalone: true,
  imports: [
    CommonModule, 
    IonList, 
    IonItem, 
    IonAvatar, 
    IonLabel, 
    IonListHeader, 
    IonText
  ],
  templateUrl: './entrenados-grouped-list.component.html'
})
export class EntrenadosGroupedListComponent {
  groupedUsers = input<{ trainerName: string; users: any[] }[]>([]);
}
