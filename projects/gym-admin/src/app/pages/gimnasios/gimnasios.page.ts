import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-gimnasios-page',
  imports: [CommonModule],
  templateUrl: './gimnasios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GimnasiosPage {
  private readonly pageTitleService = inject(PageTitleService);

  constructor() {
    this.pageTitleService.setTitle('Gimnasios');
  }
}

