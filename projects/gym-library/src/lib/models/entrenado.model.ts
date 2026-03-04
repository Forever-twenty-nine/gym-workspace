import { Objetivo } from '../enums/objetivo.enum';

export interface Entrenado {
    id: string;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    entrenadoresId?: string[];
    rutinasAsignadasIds?: string[]; // IDs de RutinaAsignada
    // Plan Premium
    rutinasCreadas?: string[];
    nivel?: string;
    seguidores?: string[]; // IDs de otros Entrenados que lo siguen
    seguidos?: string[];   // IDs de otros Entrenados a los que sigue
}
