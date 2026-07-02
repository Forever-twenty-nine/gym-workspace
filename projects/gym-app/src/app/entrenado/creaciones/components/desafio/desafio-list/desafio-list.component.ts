import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, pencilOutline } from 'ionicons/icons';
import { Desafio } from 'gym-library';
import { DateBadgeComponent } from '../../../../../shared/components/date-badge/date-badge.component';

@Component({
  selector: 'app-desafio-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    DateBadgeComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './desafio-list.component.html'
})
export class DesafioListComponent {
  @Input() desafios: Desafio[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<Desafio>();

  constructor() {
    addIcons({ trashOutline, pencilOutline });
  }

  /** Días calendario entre hoy (00:00) y la fecha objetivo (00:00). Negativo si ya venció. */
  diasRestantes(fecha: Date | string | null | undefined): number {
    if (!fecha) return 0;
    const target = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
  }

  vencimientoInfo(fecha: Date | string | null | undefined): { texto: string; color: 'danger' | 'warning' | 'medium' } {
    const dias = this.diasRestantes(fecha);
    if (dias < 0) return { texto: 'Vencido', color: 'danger' };
    if (dias === 0) return { texto: 'Vence hoy', color: 'warning' };
    if (dias === 1) return { texto: 'Vence mañana', color: 'warning' };
    return { texto: `Vence en ${dias} días`, color: 'medium' };
  }

  onCreate() {
    this.create.emit();
  }

  onDelete(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.delete.emit(id);
  }

  onEdit(item: Desafio, event?: Event) {
    if (event) event.stopPropagation();
    this.edit.emit(item);
  }
}