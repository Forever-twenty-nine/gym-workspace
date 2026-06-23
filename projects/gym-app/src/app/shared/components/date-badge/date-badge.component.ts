import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-badge.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DateBadgeComponent {
  fecha = input<Date | string | null | undefined>(undefined);
  esEjecutable = input<boolean>(false);
  diaCorto = input<string | undefined>(undefined);

  diaNombre = computed(() => {
    if (this.esEjecutable()) {
      return 'HOY';
    }
    const f = this.fecha();
    if (f) {
      const fechaObj = new Date(f);
      const opciones: Intl.DateTimeFormatOptions = { weekday: 'short' };
      return fechaObj.toLocaleDateString('es-ES', opciones).toUpperCase().replace('.', '');
    }
    return this.diaCorto() || 'PRÓX';
  });

  diaNumero = computed(() => {
    const f = this.fecha();
    if (f) {
      return new Date(f).getDate().toString();
    }
    return '';
  });

  mesNombre = computed(() => {
    const f = this.fecha();
    if (f) {
      const fechaObj = new Date(f);
      const opciones: Intl.DateTimeFormatOptions = { month: 'short' };
      return fechaObj.toLocaleDateString('es-ES', opciones).toUpperCase().replace('.', '');
    }
    return '';
  });
}
