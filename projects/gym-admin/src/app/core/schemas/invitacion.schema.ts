import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const INVITACION_COLUMNS: ColumnConfig[] = [
    { key: 'remitenteNombre', label: 'Remitente', type: 'text' },
    { key: 'destinatarioNombre', label: 'Destinatario', type: 'text' },
    { key: 'tipo', label: 'Tipo', type: 'text' },
    {
        key: 'estado',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Pendiente',
            falseLabel: 'Otro',
            trueClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            falseClass: 'bg-gray-100 text-gray-700 border border-gray-200'
        }
    },
    { key: 'fechaCreacion', label: 'Fecha', type: 'date' }
];

export const INVITACION_SCHEMA: FieldConfig[] = [
    { name: 'section_partes', label: 'Participantes', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'remitenteId', label: 'Remitente ID', type: 'text' },
    { name: 'remitenteNombre', label: 'Remitente Nombre', type: 'text' },
    { name: 'destinatarioId', label: 'Destinatario ID', type: 'text' },
    { name: 'destinatarioNombre', label: 'Destinatario Nombre', type: 'text' },
    { name: 'emailDestinatario', label: 'Email Destinatario', type: 'email' },

    { name: 'section_detalle', label: 'Detalle de la Invitación', type: 'heading', colSpan: 2 },
    {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
            { value: 'gimnasio_a_entrenador', label: 'Gimnasio → Entrenador' },
            { value: 'entrenador_a_entrenado', label: 'Entrenador → Entrenado' }
        ]
    },
    { name: 'mensajePersonalizado', label: 'Mensaje Personalizado', type: 'textarea', colSpan: 2 },

    { name: 'section_estado', label: 'Estado y Fechas', type: 'heading', colSpan: 2 },
    {
        name: 'estado',
        label: 'Estado',
        type: 'select',
        options: [
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'aceptada', label: 'Aceptada' },
            { value: 'rechazada', label: 'Rechazada' }
        ],
        validators: [Validators.required]
    },
    { name: 'activa', label: 'Activa', type: 'checkbox' },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaRespuesta', label: 'Fecha Respuesta', type: 'date' }
];
