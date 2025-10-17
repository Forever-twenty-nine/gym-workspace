import { Objetivo } from '../enums/objetivo.enum';

export interface Entrenado {
    id: string;
    activo: boolean;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    entrenadoresId?: string[];
    rutinasAsignadas?: string[];
    // Plan Premium
    rutinasCreadas?: string[];
}
