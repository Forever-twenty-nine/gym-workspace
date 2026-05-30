import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { PageTitleService } from '../../services/page-title.service';
import { GimnasioService } from '../../services/gimnasio.service';

@Component({
  selector: 'app-gimnasios-page',
  imports: [],
  templateUrl: './gimnasios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GimnasiosPage {
  private readonly pageTitleService = inject(PageTitleService);
  public readonly gimnasioService = inject(GimnasioService);

  constructor() {
    this.pageTitleService.setTitle('Gimnasios');
    this.gimnasioService.initializeListener();
  }

  async toggleActivo(gimnasio: any) {
    try {
      await this.gimnasioService.save({
        ...gimnasio,
        activo: !gimnasio.activo
      });
    } catch (e) {
      console.error('Error al cambiar estado del gimnasio:', e);
    }
  }

  getPersonalTrainersCount(): number {
    return this.gimnasioService.gimnasios().filter(g => g.isPersonalTrainer).length;
  }
}

