import { Injectable } from '@angular/core';
import { ColumnConfig, FieldConfig } from '../models/data-config.model';
import { ENTRENADO_SCHEMA, ENTRENADO_COLUMNS } from './schemas/entrenado.schema';
import { ENTRENADOR_SCHEMA, ENTRENADOR_COLUMNS } from './schemas/entrenador.schema';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private fields: Record<string, FieldConfig[]> = {
        'entrenado': ENTRENADO_SCHEMA,
        'entrenador': ENTRENADOR_SCHEMA
    };

    private columns: Record<string, ColumnConfig[]> = {
        'entrenado': ENTRENADO_COLUMNS,
        'entrenador': ENTRENADOR_COLUMNS
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
