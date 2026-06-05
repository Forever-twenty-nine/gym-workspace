import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Plan } from 'gym-library';

export const GIMNASIO_COLUMNS: ColumnConfig[] = [
    { key: 'nombre', label: 'Gimnasio', type: 'text' },
    { key: 'direccion', label: 'Dirección', type: 'text' },
    {
        key: 'isPersonalTrainer',
        label: 'Tipo',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Personal Trainer',
            falseLabel: 'Tradicional',
            trueClass: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
            falseClass: 'bg-blue-100 text-blue-700 border border-blue-200'
        }
    },
    { key: 'entrenadoresCount', label: 'Entrenadores', type: 'text' },
    { key: 'entrenadosCount', label: 'Alumnos', type: 'text' },
    {
        key: 'activo',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Activo',
            falseLabel: 'Inactivo',
            trueClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            falseClass: 'bg-red-100 text-red-700 border border-red-200'
        }
    }
];

export const GIMNASIO_SCHEMA: FieldConfig[] = [
    { name: 'section_info', label: 'Información del Gimnasio', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'nombre', label: 'Nombre', type: 'text', validators: [Validators.required] },
    { name: 'direccion', label: 'Dirección', type: 'text' },
    {
        name: 'plan',
        label: 'Plan',
        type: 'select',
        options: [
            { value: Plan.FREE, label: 'Free' },
            { value: Plan.PREMIUM, label: 'Premium' }
        ]
    },

    { name: 'section_type', label: 'Tipo y Estado', type: 'heading', colSpan: 2 },
    { name: 'isPersonalTrainer', label: 'Es Personal Trainer', type: 'checkbox' },
    { name: 'activo', label: 'Activo', type: 'checkbox' },

    { name: 'section_stats', label: 'Estadísticas (Solo Lectura)', type: 'heading', colSpan: 2 },
    { name: 'entrenadoresIds', label: 'Entrenadores Asignados', type: 'infolist', colSpan: 2 },
    { name: 'entrenadosIds', label: 'Alumnos Asignados', type: 'infolist', colSpan: 2 }
];
