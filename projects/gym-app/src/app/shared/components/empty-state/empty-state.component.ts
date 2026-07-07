import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText, IonIcon, IonSpinner } from '@ionic/angular/standalone';

/**
 * Estado vacío unificado.
 *
 * Reglas de look único (idénticas para todas las variantes):
 *  - Misma caja centrada (padding, ancho máximo 320px, gap 8px).
 *  - Misma tipografía (h3 18px semi-bold gris, p 14px gris).
 *
 * Variantes admitidas (visualmente coherentes entre sí):
 *  - Estándar:  <app-empty-state icon="…" title="…" message="…" />
 *  - Texto:     <app-empty-state title="…" message="…" />                  (sin icono)
 *  - Loading:   <app-empty-state title="Cargando…" [loading]="true" />     (spinner en vez de icono)
 *  - Premium:   <app-empty-state icon="lock-closed" [premium]="true" … />  (icono en warning)
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  standalone: true,
  imports: [CommonModule, IonText, IonIcon, IonSpinner]
})
export class EmptyStateComponent {
  /** Icono Ionic. Si se omite no se muestra el icono. */
  icon = input<string>();

  /** Título principal del estado vacío. */
  title = input.required<string>();

  /** Mensaje descriptivo debajo del título. Opcional (no todas las variantes lo necesitan). */
  message = input<string>();

  /** Si es true, muestra un spinner en lugar del icono. Útil para loaders. */
  loading = input<boolean>(false);

  /** Si es true, aplica look premium (icono en color warning). */
  premium = input<boolean>(false);
}
