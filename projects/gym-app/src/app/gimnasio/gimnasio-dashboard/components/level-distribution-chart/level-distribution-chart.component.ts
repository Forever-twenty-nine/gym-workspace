import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-level-distribution-chart',
  standalone: true,
  imports: [CommonModule, IonText],
  templateUrl: './level-distribution-chart.component.html'
})
export class LevelDistributionChartComponent {
  total = input<number>(0);
  novato = input<number>(0);
  intermedio = input<number>(0);
  avanzado = input<number>(0);
}
