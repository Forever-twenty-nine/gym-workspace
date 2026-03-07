import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFecha',
  standalone: true
})
export class FormatFechaPipe implements PipeTransform {
  transform(fecha: any, options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-ES', options);
  }
}
