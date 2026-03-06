import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { SidebarService } from './services/sidebar.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [ 
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    ToastComponent
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private sidebarService = inject(SidebarService);
  private toastService = inject(ToastService);

  isCollapsed = this.sidebarService.isCollapsed;
  toasts = this.toastService.toasts;

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
