import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';
import { HeaderComponent } from './components/shared/header/header.component';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [ 
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private sidebarService = inject(SidebarService);

  isCollapsed = this.sidebarService.isCollapsed;

  // Componente raíz simplificado
  // La lógica específica de cada sección está en sus respectivas páginas:
  // - EntrenadosPage: /pages/entrenados/entrenados.page.ts
  // - EntrenadoresPage: /pages/entrenadores-gimnasios/entrenadores.page.ts
  // - GimnasiosPage: /pages/entrenadores-gimnasios/gimnasios.page.ts
}
