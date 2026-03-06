import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-gray-700 rounded-lg mb-4">
      <div class="px-6 py-2">
        <h1 class="text-2xl font-bold text-white text-center">{{ title() }}</h1>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private pageTitleService = inject(PageTitleService);
  title = this.pageTitleService.title;
}