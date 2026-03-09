import { Component, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenu } from '@ionic/angular/standalone';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonMenu],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;
}
