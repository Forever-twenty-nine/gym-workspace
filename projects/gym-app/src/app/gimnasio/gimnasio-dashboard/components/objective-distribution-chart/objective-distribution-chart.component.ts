import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';

@Component({
  selector: 'app-objective-distribution-chart',
  standalone: true,
  imports: [CommonModule, IonText, IonGrid, IonRow, IonCol],
  templateUrl: './objective-distribution-chart.component.html',
  styles: [`
    ion-row {
      margin: 0 -4px;
    }
  `]
})
export class ObjectiveDistributionChartComponent {
  total = input<number>(0);
  salud = input<number>(0);
  volumen = input<number>(0);
  definicion = input<number>(0);
  fuerza = input<number>(0);

  getPercentage(value: number): number {
    const tot = this.total();
    return tot > 0 ? Math.round((value / tot) * 100) : 0;
  }
}
