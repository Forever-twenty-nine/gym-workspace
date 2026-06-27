import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { IonButton, IonIcon, IonAvatar, IonLabel, IonItem } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil-user-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, IonButton, IonIcon, IonAvatar, IonLabel, IonItem],
  templateUrl: './perfil-user-header.component.html',
  styles: [`
    .initials-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: var(--ion-color-light);
      color: var(--ion-color-medium);
      font-weight: 600;
      font-size: 1.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilUserHeaderComponent {
  user = input.required<{
    nombre?: string;
    role?: string;
    photoURL?: string;
  }>();

  initials = input.required<string>();
  roleDisplayName = input.required<string>();

  editClick = output<void>();
}
