import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const ENTRENADO_COLUMNS: ColumnConfig[] = [
    { key: 'displayName', label: 'Nombre', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'nivel', label: 'Nivel', type: 'text' },
    { key: 'fechaRegistro', label: 'Registro', type: 'date' }
];

export const ENTRENADO_SCHEMA: FieldConfig[] = [
    // Gestión Base (Plan Free)
    { name: 'section_free', label: 'Gestión Base (Plan Free)', type: 'heading' },
    { name: 'id', label: 'ID (UID)', type: 'text', validators: [Validators.required] },
    { name: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },
    {
        name: 'objetivo',
        label: 'Objetivo Principal',
        type: 'select',
        options: [
            { value: 'volumen', label: 'Volumen' },
            { value: 'definicion', label: 'Definición' },
            { value: 'fuerza', label: 'Fuerza' },
            { value: 'salud', label: 'Salud / Bienestar' }
        ]
    },
    {
        name: 'entrenadoresId',
        label: 'Entrenadores Asignados',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'rutinasAsignadasIds',
        label: 'Rutinas Asignadas',
        type: 'infolist',
        colSpan: 2
    },

    // Social y Notificaciones
    { name: 'section_social', label: 'Social y Notificaciones', type: 'heading' },
    {
        name: 'seguidores',
        label: 'Seguidores',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'seguidos',
        label: 'Seguidos',
        type: 'infolist',
        colSpan: 2
    },
    { name: 'configNotificaciones', label: 'Config. Notificaciones', type: 'text', colSpan: 2 },

    // Características Premium
    { name: 'section_premium', label: 'Características Premium', type: 'heading' },
    {
        name: 'rutinasCreadas',
        label: 'Rutinas Creadas (Propias)',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'nivel',
        label: 'Nivel de Experiencia',
        type: 'select',
        options: [
            { value: 'novato', label: 'Novato' },
            { value: 'principiante', label: 'Principiante' },
            { value: 'intermedio', label: 'Intermedio' },
            { value: 'avanzado', label: 'Avanzado' },
            { value: 'experto', label: 'Experto' }
        ]
    },
];
