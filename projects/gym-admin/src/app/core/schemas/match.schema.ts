import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const MATCH_COLUMNS: ColumnConfig[] = [
    { key: 'origNombre', label: 'Usuario Origen', type: 'text' },
    { key: 'destNombre', label: 'Usuario Destino', type: 'text' },
    {
        key: 'tipo',
        label: 'Tipo de Match',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Horario',
            falseLabel: 'Otro',
            trueClass: 'bg-blue-100 text-blue-700 border border-blue-200',
            falseClass: 'bg-gray-100 text-gray-700 border border-gray-200'
        }
    },
    {
        key: 'mutuo',
        label: 'Estado',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Mutuo (Hay Equipo)',
            falseLabel: 'Pendiente',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
        }
    },
    { key: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { key: 'fechaMatch', label: 'Fecha Match', type: 'date' }
];

export const MATCH_SCHEMA: FieldConfig[] = [
    { name: 'section_info', label: 'Información del Match', type: 'heading', colSpan: 2 },
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'usuarioOrigenId', label: 'Usuario Origen ID', type: 'text' },
    { name: 'usuarioDestinoId', label: 'Usuario Destino ID', type: 'text' },
    {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        options: [
            { value: 'horario', label: 'Horario' },
            { value: 'desafio', label: 'Desafío' },
            { value: 'afinidad', label: 'Afinidad' }
        ]
    },
    { name: 'interesOrigen', label: 'Interés Origen', type: 'checkbox' },
    { name: 'interesDestino', label: 'Interés Destino', type: 'checkbox' },
    { name: 'mutuo', label: 'Mutuo', type: 'checkbox' },
    { name: 'fechaCreacion', label: 'Fecha Creación', type: 'date' },
    { name: 'fechaMatch', label: 'Fecha Match', type: 'date' },
    { name: 'referenciaId', label: 'Referencia (Desafío)', type: 'text' }
];
