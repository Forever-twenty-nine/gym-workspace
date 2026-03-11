import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataComponent } from '../../components/shared/data/data.component';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { MensajesGlobalesService } from '../../core/services/mensajes-globales.service';

@Component({
  selector: 'app-mensajes-globales',
  standalone: true,
  imports: [CommonModule, DataComponent],
  templateUrl: './mensajes-globales.html'
})
export class MensajesGlobalesComponent {
  private readonly mensajesService = inject(MensajesGlobalesService);

  readonly items = this.mensajesService.mensajes;

  readonly columns: ColumnConfig[] = [
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'mensaje', label: 'Mensaje', type: 'text' },
    { key: 'fechaCreacion', label: 'Fecha Creado', type: 'date' },
    { key: 'activo', label: 'Activo', type: 'boolean' }
  ];

  readonly fields: FieldConfig[] = [
    { name: 'titulo', label: 'Título', type: 'text', placeholder: 'Título del anuncio' },
    { name: 'mensaje', label: 'Mensaje', type: 'textarea', placeholder: 'Escriba aquí el contenido del anuncio...' },
    { name: 'activo', label: 'Activo (Visible)', type: 'select', defaultValue: true, options: [
      { label: 'Sí', value: true },
      { label: 'No', value: false }
    ] }
  ];

  async onSave(data: any) {
    if (data.id) {
      await this.mensajesService.update(data.id, data);
    } else {
      await this.mensajesService.create(data);
    }
  }

  async onDelete(id: string) {
    await this.mensajesService.delete(id);
  }
}
