import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const DESAFIO_COLUMNS: ColumnConfig[] = [
    { key: 'creadorNombre', label: 'Creador', type: 'text' },
    { key: 'titulo', label: 'Título del Reto', type: 'text' },
    { key: 'logroRelacionado', label: 'Récord Relacionado', type: 'text' },
    { key: 'disciplina', label: 'Disciplina', type: 'text' },
    { key: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    {
        key: 'activo',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Activo',
            falseLabel: 'Inactivo',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-red-100 text-red-700 border border-red-200'
        }
    }
];

export const DESAFIO_SCHEMA: FieldConfig[] = [
    { name: 'section_info', label: 'Información del Desafío', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'creadorId', label: 'Creador ID', type: 'text' },
    { name: 'creadorNombre', label: 'Creador Nombre', type: 'text' },
    { name: 'titulo', label: 'Título', type: 'text', validators: [Validators.required] },
    { name: 'logroRelacionado', label: 'Logro Relacionado', type: 'text' },
    { name: 'disciplina', label: 'Disciplina', type: 'text' },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaVencimiento', label: 'Fecha Vencimiento', type: 'date' },
    { name: 'activo', label: 'Activo', type: 'checkbox' },
    { name: 'gimnasioId', label: 'Gimnasio ID', type: 'text' }
];
