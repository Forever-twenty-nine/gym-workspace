import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil-goals',
  standalone: true,
  imports: [CommonModule, IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent],
  templateUrl: './perfil-goals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilGoalsComponent {
  entrenado = input.required<{
    objetivo?: string;
    nivel?: string;
  }>();
}
