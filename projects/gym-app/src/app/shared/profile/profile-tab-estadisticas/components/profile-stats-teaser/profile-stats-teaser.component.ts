import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-stats-teaser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-stats-teaser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileStatsTeaserComponent {
  viewPlansClick = output<void>();
}
