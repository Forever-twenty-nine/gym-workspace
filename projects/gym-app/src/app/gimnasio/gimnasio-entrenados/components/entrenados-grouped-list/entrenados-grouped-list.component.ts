import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonListHeader,
  IonLabel
} from '@ionic/angular/standalone';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ListItemComponent } from '../../../../shared/components/app-list-item/app-list-item.component';

@Component({
  selector: 'app-entrenados-grouped-list',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonListHeader,
    IonLabel,
    EmptyStateComponent,
    ListItemComponent
  ],
  templateUrl: './entrenados-grouped-list.component.html'
})
export class EntrenadosGroupedListComponent {
  groupedUsers = input<{ trainerName: string; users: any[] }[]>([]);
}
