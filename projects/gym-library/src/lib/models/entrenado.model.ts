import { Objetivo } from '../enums/objetivo.enum';

export interface Entrenado {
    id: string;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    entrenadoresId?: string[];
    rutinasAsignadas?: string[];
    // Plan Premium
    rutinasCreadas?: string[];
}
