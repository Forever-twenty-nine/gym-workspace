import { ColumnConfig, FieldConfig } from '../../models/data-config.model';
import { TipoMensaje } from 'gym-library';

export const MENSAJE_COLUMNS: ColumnConfig[] = [
    { key: 'remitenteNombre', label: 'Remitente', type: 'text' },
    { key: 'destinatarioNombre', label: 'Destinatario', type: 'text' },
    { key: 'contenido', label: 'Mensaje', type: 'text' },
    {
        key: 'tipo',
        label: 'Tipo',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Texto',
            falseLabel: 'Multimedia',
            trueClass: 'bg-blue-100 text-blue-700 border border-blue-200',
            falseClass: 'bg-purple-100 text-purple-700 border border-purple-200'
        }
    },
    {
        key: 'leido',
        label: 'Leído',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Sí',
            falseLabel: 'No',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        }
    },
    { key: 'fechaEnvio', label: 'Enviado', type: 'date' }
];

export const MENSAJE_SCHEMA: FieldConfig[] = [
    { name: 'section_partes', label: 'Participantes', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'remitenteId', label: 'Remitente ID', type: 'text' },
    { name: 'remitenteTipo', label: 'Tipo Remitente', type: 'text' },
    { name: 'destinatarioId', label: 'Destinatario ID', type: 'text' },
    { name: 'destinatarioTipo', label: 'Tipo Destinatario', type: 'text' },

    { name: 'section_contenido', label: 'Contenido', type: 'heading', colSpan: 2 },
    { name: 'contenido', label: 'Mensaje', type: 'textarea', colSpan: 2 },
    {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
            { value: 'texto', label: 'Texto' },
            { value: 'imagen', label: 'Imagen' },
            { value: 'video', label: 'Video' },
            { value: 'audio', label: 'Audio' }
        ]
    },
    { name: 'archivoUrl', label: 'URL Archivo', type: 'text' },

    { name: 'section_estado', label: 'Estado', type: 'heading', colSpan: 2 },
    { name: 'leido', label: 'Leído', type: 'checkbox' },
    { name: 'entregado', label: 'Entregado', type: 'checkbox' },
    { name: 'fechaEnvio', label: 'Fecha Envío', type: 'date' },
    { name: 'fechaLeido', label: 'Fecha Leído', type: 'date' },
    { name: 'fechaEditado', label: 'Fecha Editado', type: 'date' }
];
