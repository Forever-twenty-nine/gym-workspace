import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonListHeader, 
  IonText,
  IonCard
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
    IonText,
    IonCard
  ],
  templateUrl: './entrenados-grouped-list.component.html'
})
export class EntrenadosGroupedListComponent {
  groupedUsers = input<{ trainerName: string; users: any[] }[]>([]);
}
