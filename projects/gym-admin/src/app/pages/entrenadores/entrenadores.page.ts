import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  EntrenadorService
} from 'gym-library';
import { ToastComponent } from '../../components/shared/toast/toast.component';
import { EntrenadoresTableComponent } from './entrenadores-table/entrenadores-table.component';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-entrenadores-page',
  imports: [
    CommonModule,
    ToastComponent,
    EntrenadoresTableComponent
  ],
  templateUrl: './entrenadores.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoresPage {

  // generales
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly entrenadorService = inject(EntrenadorService);
  
  private readonly router = inject(Router);

  constructor() {
    this.pageTitleService.setTitle('Entrenadores');
    this.entrenadorService.initializeListener();
  }

  readonly entrenadores = this.entrenadorService.getEntrenadoresWithUserInfo();

  goToDetail(item: any) {
    this.router.navigate(['/entrenadores', item.id]);
  }
}
