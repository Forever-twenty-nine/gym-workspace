import { Objetivo } from '../enums/objetivo.enum';

export interface ConfigNotificacion {
    recordatoriosEntrenamiento: boolean;
    horaRecordatorio?: string; // Formato "HH:mm"
    diasRecordatorio?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Domingo)
}

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
    configNotificaciones?: ConfigNotificacion;
}
