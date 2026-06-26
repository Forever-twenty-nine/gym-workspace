import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const COMENTARIO_COLUMNS: ColumnConfig[] = [
    { key: 'nombreUsuario', label: 'Usuario', type: 'text' },
    { key: 'contenido', label: 'Comentario', type: 'text' },
    { key: 'fecha', label: 'Fecha', type: 'date' },
    { key: 'sesionId', label: 'Publicación ID', type: 'text' },
    {
        key: 'tieneRespuesta',
        label: 'Respondido',
        type: 'badge',
        badgeConfig: {
            trueLabel: 'Sí',
            falseLabel: 'No',
            trueClass: 'bg-green-100 text-green-700 border border-green-200',
            falseClass: 'bg-gray-100 text-gray-700 border border-gray-200'
        }
    }
];

export const COMENTARIO_SCHEMA: FieldConfig[] = [
    { name: 'id', label: 'ID Comentario', type: 'text' },
    { name: 'nombreUsuario', label: 'Usuario', type: 'text' },
    { name: 'contenido', label: 'Contenido', type: 'textarea' },
    { name: 'fecha', label: 'Fecha', type: 'date' },
    { name: 'sesionId', label: 'ID Publicación', type: 'text' },
    { name: 'respuestaContenido', label: 'Respuesta del Creador', type: 'textarea' }
];
