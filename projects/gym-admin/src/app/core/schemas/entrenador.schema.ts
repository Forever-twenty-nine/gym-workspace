import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const ENTRENADOR_COLUMNS: ColumnConfig[] = [
    { key: 'displayName', label: 'Nombre', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'fechaRegistro', label: 'Registro', type: 'date' }
];

export const ENTRENADOR_SCHEMA: FieldConfig[] = [
    // Gestión Base (Plan Free)
    { name: 'section_free', label: 'Gestión Base (Plan Free)', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID (UID)', type: 'text', validators: [Validators.required] },
    { name: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },

    // Asociaciones y Contenido
    { name: 'section_assoc', label: 'Asociaciones y Contenido', type: 'heading', colSpan: 2 },
    {
        name: 'info_ejercicios',
        label: 'Ejercicios Creados',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'info_rutinas',
        label: 'Rutinas Creadas',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'entrenadosAsignadosIds',
        label: 'Entrenados Asignados',
        type: 'multiselect',
        colSpan: 2
    },

    // Características Premium
    { name: 'section_premium', label: 'Características Premium', type: 'heading', colSpan: 2 },
    {
        name: 'entrenadosPremiumIds',
        label: 'Entrenados Premium',
        type: 'multiselect',
        colSpan: 2
    }
];
