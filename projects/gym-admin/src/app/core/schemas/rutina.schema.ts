import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const RUTINA_COLUMNS: ColumnConfig[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'activa', label: 'Activa', type: 'boolean' },
    { key: 'duracion', label: 'Duración (min)', type: 'text' },
    { key: 'fechaCreacion', label: 'Creado', type: 'date' }
];

export const RUTINA_SCHEMA: FieldConfig[] = [
    // Plan Free
    { name: 'section_free', label: 'Gestión Base (Plan Free)', type: 'heading', colSpan: 2 },
    { name: 'creadorId', label: 'ID Creador', type: 'text' },
    { name: 'nombre', label: 'Nombre', type: 'text', validators: [Validators.required] },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'activa', label: 'Activa', type: 'checkbox' },
    {
        name: 'ejerciciosIds',
        label: 'Ejercicios',
        type: 'multiselect',
        colSpan: 2
    },

    // Social
    { name: 'section_social', label: 'Social', type: 'heading', colSpan: 2 },
    { name: 'compartida', label: 'Compartida', type: 'checkbox' },
    { name: 'usuarioId', label: 'ID Usuario', type: 'text' },
    { name: 'nombreUsuario', label: 'Nombre de Usuario', type: 'text' },
    { name: 'fechaCompartida', label: 'Fecha Compartida', type: 'date' },

    // Plan Premium
    { name: 'section_premium', label: 'Características Premium', type: 'heading', colSpan: 2 },
    { name: 'duracion', label: 'Duración (min)', type: 'number' },

    // Metadatos
    { name: 'section_meta', label: 'Metadatos', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID Rutina', type: 'text' },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaModificacion', label: 'Fecha Modificación', type: 'date' }
];
