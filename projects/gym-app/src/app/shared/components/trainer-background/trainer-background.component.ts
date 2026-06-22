import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-trainer-background',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './trainer-background.component.html'
})
export class TrainerBackgroundComponent {
  isPremium = input<boolean>(false);
}
