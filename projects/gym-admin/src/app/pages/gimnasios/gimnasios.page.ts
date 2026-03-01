import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-gimnasios-page',
  imports: [],
  templateUrl: './gimnasios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GimnasiosPage {
  private readonly pageTitleService = inject(PageTitleService);

  constructor() {
    this.pageTitleService.setTitle('Gimnasios');
  }
}

