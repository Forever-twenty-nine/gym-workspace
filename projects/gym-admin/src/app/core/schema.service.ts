import { Injectable } from '@angular/core';
import { ColumnConfig, FieldConfig } from '../models/data-config.model';
import { ENTRENADO_SCHEMA, ENTRENADO_COLUMNS } from './schemas/entrenado.schema';
import { ENTRENADOR_SCHEMA, ENTRENADOR_COLUMNS } from './schemas/entrenador.schema';
import { EJERCICIO_SCHEMA, EJERCICIO_COLUMNS } from './schemas/ejercicio.schema';
import { RUTINA_SCHEMA, RUTINA_COLUMNS } from './schemas/rutina.schema';
import { USUARIO_SCHEMA, USUARIO_COLUMNS } from './schemas/usuarios.schema';
import { RUTINA_ASIGNADA_SCHEMA, RUTINA_ASIGNADA_COLUMNS } from './schemas/rutina-asignada.schema';
import { SESION_RUTINA_SCHEMA, SESION_RUTINA_COLUMNS } from './schemas/sesion-rutina.schema';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private fields: Record<string, FieldConfig[]> = {
        'entrenado': ENTRENADO_SCHEMA,
        'entrenador': ENTRENADOR_SCHEMA,
        'ejercicio': EJERCICIO_SCHEMA,
        'rutina': RUTINA_SCHEMA,
        'usuario': USUARIO_SCHEMA,
        'rutinaAsignada': RUTINA_ASIGNADA_SCHEMA,
        'sesionRutina': SESION_RUTINA_SCHEMA
    };

    private columns: Record<string, ColumnConfig[]> = {
        'entrenado': ENTRENADO_COLUMNS,
        'entrenador': ENTRENADOR_COLUMNS,
        'ejercicio': EJERCICIO_COLUMNS,
        'rutina': RUTINA_COLUMNS,
        'usuario': USUARIO_COLUMNS,
        'rutinaAsignada': RUTINA_ASIGNADA_COLUMNS,
        'sesionRutina': SESION_RUTINA_COLUMNS
    };

    getFields(name: string): FieldConfig[] {
        const schema = this.fields[name];
        return schema ? [...schema] : [];
    }

    getColumns(name: string): ColumnConfig[] {
        const cols = this.columns[name];
        return cols ? [...cols] : [];
    }

    getDynamicSchema(name: string, optionsMap: Record<string, { value: any, label: string }[]>): FieldConfig[] {
        const baseFields = this.getFields(name);

        return baseFields.map(field => {
            if (optionsMap[field.name]) {
                return { ...field, options: optionsMap[field.name] };
            }
            return field;
        });
    }
}
