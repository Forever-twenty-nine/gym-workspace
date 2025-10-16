import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entrenadores-table',
  imports: [CommonModule],
  templateUrl: './entrenadores-table.component.html',
 
})
export class EntrenadoresTableComponent {
  @Input() items: any[] = [];
  @Output() edit = new EventEmitter<any>();

  onEdit(item: any) {
    this.edit.emit(item);
  }
}