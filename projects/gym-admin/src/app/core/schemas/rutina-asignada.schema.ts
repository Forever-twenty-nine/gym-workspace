import { Validators } from '@angular/forms';
import { ColumnConfig, FieldConfig } from '../../models/data-config.model';

export const RUTINA_ASIGNADA_COLUMNS: ColumnConfig[] = [
    { key: 'rutinaNombre', label: 'Rutina', type: 'text' },
    { key: 'entrenadoNombre', label: 'Entrenado', type: 'text' },
    { key: 'entrenadorNombre', label: 'Entrenador', type: 'text' },
    { key: 'diaSemana', label: 'Día Semana', type: 'text' },
    { key: 'fechaAsignacion', label: 'Asignada', type: 'date' }
];

export const RUTINA_ASIGNADA_SCHEMA: FieldConfig[] = [
    { name: 'rutinaId', label: 'Rutina', type: 'select', validators: [Validators.required], colSpan: 1 },
    { name: 'entrenadoId', label: 'Entrenado', type: 'select', validators: [Validators.required], colSpan: 1 },
    { name: 'entrenadorId', label: 'Entrenador', type: 'select', validators: [Validators.required], colSpan: 1 },
    { name: 'diaSemana', label: 'Día de la Semana', type: 'select', options: [
        { label: 'Lunes', value: 'Lunes' },
        { label: 'Martes', value: 'Martes' },
        { label: 'Miércoles', value: 'Miércoles' },
        { label: 'Jueves', value: 'Jueves' },
        { label: 'Viernes', value: 'Viernes' },
        { label: 'Sábado', value: 'Sábado' },
        { label: 'Domingo', value: 'Domingo' }
    ], colSpan: 1 },
    { name: 'activa', label: 'Activa', type: 'checkbox', colSpan: 1 },
    { name: 'fechaAsignacion', label: 'Fecha Asignación', type: 'date', colSpan: 1 }
];
