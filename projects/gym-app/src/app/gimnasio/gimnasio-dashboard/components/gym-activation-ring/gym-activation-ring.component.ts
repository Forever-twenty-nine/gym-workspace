import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gym-activation-ring',
  standalone: true,
  imports: [CommonModule, IonText],
  templateUrl: './gym-activation-ring.component.html'
})
export class GymActivationRingComponent {
  rate = input<number>(0);
}
