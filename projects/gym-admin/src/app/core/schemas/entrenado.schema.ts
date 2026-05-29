import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Objetivo } from 'gym-library';

export const ENTRENADO_COLUMNS: ColumnConfig[] = [
    { key: 'displayName', label: 'Nombre', type: 'avatar' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'objetivo', label: 'Objetivo', type: 'text' },
    { key: 'fechaRegistro', label: 'Registro', type: 'date' }
];

export const ENTRENADO_SCHEMA: FieldConfig[] = [
    // Gestión Base (Plan Free)
    { name: 'section_free', label: 'Gestión Base (Plan Free)', type: 'heading', colSpan: 2 },
    {
        name: 'objetivo',
        label: 'Objetivo',
        type: 'select',
        colSpan: 2,
        placeholder: 'Seleccione un objetivo',
        options: [
            { value: Objetivo.VOLUMEN, label: 'Volumen' },
            { value: Objetivo.DEFINICION, label: 'Definición' },
            { value: Objetivo.FUERZA, label: 'Fuerza' },
            { value: Objetivo.SALUD, label: 'Salud / Bienestar' }
        ]
    },
    { name: 'id', label: 'ID (UID)', type: 'text', validators: [Validators.required] },
    { name: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },
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
    { name: 'section_social', label: 'Social, Matching y Notificaciones', type: 'heading', colSpan: 2 },
    {
        name: 'bio',
        label: 'Biografía Corta',
        type: 'textarea',
        placeholder: 'Escribe una breve biografía para el perfil social',
        colSpan: 2
    },
    {
        name: 'tags',
        label: 'Tags de Estilo de Vida (Afinidad)',
        type: 'infolist',
        placeholder: 'Tags del estilo de vida fitness',
        colSpan: 2
    },
    {
        name: 'disciplinas',
        label: 'Disciplinas de Entrenamiento',
        type: 'infolist',
        placeholder: 'Disciplinas practicadas',
        colSpan: 2
    },
    {
        name: 'franjaHoraria',
        label: 'Franja Horaria de Entrenamiento',
        type: 'text',
        placeholder: 'Ej: {"inicio": "19:00", "fin": "21:00"}',
        colSpan: 2
    },
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
    { name: 'section_premium', label: 'Características Premium', type: 'heading', colSpan: 2 },
    {
        name: 'rutinasCreadas',
        label: 'Rutinas Creadas (Propias)',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'ejerciciosCreadosIds',
        label: 'Ejercicios Creados (Propios)',
        type: 'infolist',
        colSpan: 2
    },
    {
        name: 'nivel',
        label: 'Nivel de Experiencia',
        type: 'select',
        placeholder: 'Seleccione un nivel',
        options: [
            { value: 'novato', label: 'Novato' },
            { value: 'principiante', label: 'Principiante' },
            { value: 'intermedio', label: 'Intermedio' },
            { value: 'avanzado', label: 'Avanzado' },
            { value: 'experto', label: 'Experto' }
        ]
    },
];
