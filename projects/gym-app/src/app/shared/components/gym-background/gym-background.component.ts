import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-gym-background',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './gym-background.component.html'
})
export class GymBackgroundComponent {
  isPremium = input<boolean>(false);
}
