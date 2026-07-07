import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-badge.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 12px;
      border: 1px solid var(--ion-color-step-250, #d7d8da);
      text-align: center;
      overflow: hidden;
      box-sizing: border-box;
    }

    :host([data-ejecutable="true"]) {
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }

    > span:nth-child(1) {
      width: 100%;
      padding: 2px 0;
      border-bottom: 1px solid var(--ion-color-step-250, #d7d8da);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      font-size: 9px;
      opacity: 0.7;
    }

    :host([data-ejecutable="true"]) > span:nth-child(1) {
      border-bottom-color: rgba(255, 255, 255, 0.2);
      color: var(--ion-color-primary-contrast);
    }

    > span:nth-child(2) {
      font-size: 1.1rem;
      font-weight: 900;
      line-height: 1;
      margin-top: 2px;
    }

    > span:nth-child(3) {
      font-size: 0.5rem;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.6;
    }

    > span:nth-child(4) {
      font-size: 1.25rem;
      font-weight: 700;
      opacity: 0.5;
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
