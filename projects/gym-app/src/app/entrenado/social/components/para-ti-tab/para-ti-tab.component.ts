import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { FeedTabComponent } from './feed-tab/feed-tab.component';

@Component({
  selector: 'app-para-ti-tab',
  standalone: true,
  imports: [
    CommonModule,
    FeedTabComponent
  ],
  templateUrl: './para-ti-tab.component.html'
})
export class ParaTiTabComponent {
  private readonly authService = inject(AuthService);
  readonly currentUserSignal = this.authService.currentUser;
}
