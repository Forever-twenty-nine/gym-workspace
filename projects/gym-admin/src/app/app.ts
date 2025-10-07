import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [ 
    CommonModule,
    RouterOutlet,
    NavbarComponent
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  // Componente raíz simplificado
  // La lógica específica de cada sección está en sus respectivas páginas:
  // - EntrenadosPage: /pages/entrenados/entrenados.page.ts
  // - EntrenadoresPage: /pages/entrenadores-gimnasios/entrenadores.page.ts
  // - GimnasiosPage: /pages/entrenadores-gimnasios/gimnasios.page.ts
}
