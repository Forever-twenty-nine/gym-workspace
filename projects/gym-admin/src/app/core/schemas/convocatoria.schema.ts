import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { Rol } from 'gym-library';

export const CONVOCATORIA_COLUMNS: ColumnConfig[] = [
    { key: 'creadorNombre', label: 'Creador', type: 'text' },
    {
        key: 'creadorRol',
        label: 'Rol Creador',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Entrenado',
            falseLabel: 'Staff',
            trueClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            falseClass: 'bg-indigo-100 text-indigo-700 border border-indigo-200'
        }
    },
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'fechaEntrenamiento', label: 'Fecha Entrenamiento', type: 'date' },
    { key: 'horaInicio', label: 'Hora Inicio', type: 'time' },
    { key: 'horaFin', label: 'Hora Fin', type: 'time' },
    {
        key: 'esOficial',
        label: 'Tipo',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Oficial',
            falseLabel: 'Atleta',
            trueClass: 'bg-blue-100 text-blue-700 border border-blue-200',
            falseClass: 'bg-orange-100 text-orange-700 border border-orange-200'
        }
    },
    {
        key: 'activo',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Activa',
            falseLabel: 'Inactiva',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-red-100 text-red-700 border border-red-200'
        }
    },
    { key: 'interesados', label: 'Interesados', type: 'text' }
];

export const CONVOCATORIA_SCHEMA: FieldConfig[] = [
    { name: 'section_info', label: 'Información de la Convocatoria', type: 'heading', colSpan: 2 },

    { name: 'id', label: 'ID', type: 'text' },
    { name: 'titulo', label: 'Título', type: 'text', validators: [Validators.required] },
    { name: 'mensaje', label: 'Mensaje / Objetivo', type: 'textarea', colSpan: 2 },

    { name: 'section_fecha', label: 'Fecha y Horario', type: 'heading', colSpan: 2 },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaEntrenamiento', label: 'Fecha de Entrenamiento', type: 'date' },
    { name: 'horaInicio', label: 'Hora Inicio', type: 'time' },
    { name: 'horaFin', label: 'Hora Fin', type: 'time' },

    { name: 'section_meta', label: 'Metadatos', type: 'heading', colSpan: 2 },
    { name: 'creadorId', label: 'Creador (Usuario)', type: 'select' },
    { name: 'creadorNombre', label: 'Creador Nombre (auto)', type: 'text' },
    { name: 'gimnasioId', label: 'Gimnasio', type: 'select' },
    {
        name: 'creadorRol',
        label: 'Rol del Creador',
        type: 'select',
        options: [
            { value: Rol.ENTRENADO, label: 'Entrenado' },
            { value: Rol.ENTRENADOR, label: 'Entrenador' },
            { value: Rol.GIMNASIO, label: 'Gimnasio' },
            { value: Rol.PERSONAL_TRAINER, label: 'Personal Trainer' }
        ]
    },

    { name: 'section_flags', label: 'Estados y Flags', type: 'heading', colSpan: 2 },
    { name: 'activo', label: 'Activa', type: 'checkbox' },
    { name: 'esOficial', label: 'Es Oficial (Gym)', type: 'checkbox' },
    { name: 'esSemanal', label: 'Es Semanal', type: 'checkbox' },

    { name: 'section_participantes', label: 'Participantes', type: 'heading', colSpan: 2 },
    { name: 'interesados', label: 'IDs de Interesados (chocaron los 5)', type: 'infolist', colSpan: 2 }
];
