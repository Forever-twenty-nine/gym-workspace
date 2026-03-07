import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { accessibilityOutline, medalOutline, todayOutline } from 'ionicons/icons';

@Component({
  selector: 'app-plan-personalizado',
  templateUrl: './plan-personalizado.component.html',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanPersonalizadoComponent {
  @Input() nivel: string | undefined = '';
  @Input() objetivo: string = '';
  @Input() frecuencia: number = 0;

  constructor() {
    addIcons({ accessibilityOutline, medalOutline, todayOutline });
  }
}
