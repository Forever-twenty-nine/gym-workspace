import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const EJERCICIO_COLUMNS: ColumnConfig[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'series', label: 'Series', type: 'text' },
    { key: 'repeticiones', label: 'Reps', type: 'text' },
    { key: 'peso', label: 'Peso', type: 'text' },
    { key: 'fechaCreacion', label: 'Creado', type: 'date' }
];

export const EJERCICIO_SCHEMA: FieldConfig[] = [
    // Plan Free
    { name: 'section_free', label: 'Gestión Base (Plan Free)', type: 'heading', colSpan: 2 },
    { name: 'creadorId', label: 'ID Creador', type: 'text' },
    { name: 'nombre', label: 'Nombre', type: 'text', validators: [Validators.required] },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'series', label: 'Series', type: 'number', validators: [Validators.required] },
    { name: 'repeticiones', label: 'Repeticiones', type: 'number', validators: [Validators.required] },
    { name: 'peso', label: 'Peso (kg)', type: 'number' },

    // Plan Premium
    { name: 'section_premium', label: 'Características Premium', type: 'heading', colSpan: 2 },
    { name: 'descansoSegundos', label: 'Descanso (seg)', type: 'number' },
    { name: 'serieSegundos', label: 'Tiempo Serie (seg)', type: 'number' },

    // Metadatos
    { name: 'section_meta', label: 'Metadatos', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID Ejercicio', type: 'text' },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaModificacion', label: 'Fecha Modificación', type: 'date' }
];
