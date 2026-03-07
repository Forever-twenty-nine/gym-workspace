import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { SesionRutinaStatus } from 'gym-library';

export const SESION_RUTINA_COLUMNS: ColumnConfig[] = [
    { key: 'entrenadoId', label: 'ID Entrenado', type: 'text' },
    { key: 'fechaInicio', label: 'Inicio', type: 'date' },
    { key: 'fechaFin', label: 'Fin', type: 'date' },
    {
        key: 'status',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Completada',
            falseLabel: 'En Progreso',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-blue-100 text-blue-700 border border-blue-200'
        }
    },
    { key: 'porcentajeCompletado', label: '%', type: 'text' }
];

export const SESION_RUTINA_SCHEMA: FieldConfig[] = [
    { name: 'section_base', label: 'Información Base', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID Sesión', type: 'text' },
    { name: 'entrenadoId', label: 'ID Entrenado', type: 'text', validators: [Validators.required] },
    {
        name: 'status', label: 'Estado', type: 'select', options: [
            { value: SesionRutinaStatus.EN_PROGRESO, label: 'En Progreso' },
            { value: SesionRutinaStatus.COMPLETADA, label: 'Completada' },
            { value: SesionRutinaStatus.CANCELADA, label: 'Cancelada' },
            { value: SesionRutinaStatus.PENDIENTE, label: 'Pendiente' }
        ]
    },
    { name: 'porcentajeCompletado', label: 'Porcentaje Completado', type: 'number' },
    { name: 'completada', label: 'Completada', type: 'checkbox' },

    { name: 'section_dates', label: 'Fechas y Tiempos', type: 'heading', colSpan: 2 },
    { name: 'fechaInicio', label: 'Fecha Inicio', type: 'date' },
    { name: 'fechaFin', label: 'Fecha Fin', type: 'date' },
    { name: 'duracion', label: 'Duración (seg)', type: 'number' },
    { name: 'fechaLeido', label: 'Fecha Leído', type: 'date' },

    { name: 'section_social', label: 'Social y Comunidad', type: 'heading', colSpan: 2 },
    { name: 'compartida', label: 'Compartida en el Feed', type: 'checkbox' },
    { name: 'nombreUsuario', label: 'Nombre en el Feed', type: 'text' },
    { name: 'fotoUsuario', label: 'URL Foto Usuario', type: 'text' },
    { name: 'fechaCompartida', label: 'Fecha de Publicación', type: 'date' },
    { name: 'likes', label: 'IDs de Usuarios (Likes)', type: 'infolist', colSpan: 2 },

    { name: 'section_details', label: 'Detalles de Rutina', type: 'heading', colSpan: 2 },
    { name: 'rutinaResumen', label: 'Resumen de Rutina (ID/Nombre)', type: 'infolist', colSpan: 2 },
    { name: 'ejercicios', label: 'Ejercicios de la Sesión', type: 'infolist', colSpan: 2 }
];
