import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';

/**
 * 🔔 Campanita de notificaciones reutilizable.
 *
 * Pensada para vivir en cualquier header / tab bar de la app. El badge se
 * posiciona en la esquina superior derecha del icono (estilo app moderna:
 * Instagram, Twitter, WhatsApp). El número se trunca a "99+" cuando
 * supera las dos cifras para que el badge no se rompa visualmente.
 *
 * Inputs:
 *  - count: cantidad de notificaciones no leídas (default 0).
 *  - iconColor: color del icono de Ionic ('medium' | 'primary' | 'dark' | etc.).
 *  - ariaLabel: etiqueta accesible opcional.
 *
 * Outputs:
 *  - bellClick: emitido cuando se toca la campana.
 *
 * Este componente es deliberadamente "tonto": no lee de ningún service.
 * Quien lo usa le pasa el `count` y maneja el `click` como quiera (abrir
 * un modal, navegar, etc.). Así puede usarse también desde el menú tabs
 * de abajo o desde un header global, no solo desde el perfil.
 */
@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton],
  templateUrl: './notifications-bell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsBellComponent {
  readonly count = input<number>(0);
  readonly iconColor = input<string>('medium');
  readonly ariaLabel = input<string>('Notificaciones');

  readonly displayCount = computed(() => {
    const c = this.count();
    if (c <= 0) return '';
    if (c > 99) return '99+';
    return String(c);
  });

  readonly hasUnread = computed(() => this.count() > 0);

  readonly bellClick = output<void>();

  constructor() {
    addIcons({ notificationsOutline });
  }

  onClick(): void {
    this.bellClick.emit();
  }
}