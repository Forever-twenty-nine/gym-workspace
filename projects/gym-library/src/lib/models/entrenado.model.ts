import { Objetivo } from '../enums/objetivo.enum';
import { NivelEntrenamiento } from '../enums/nivel-entrenamiento.enum';

export interface ConfigNotificacion {
    recordatoriosEntrenamiento: boolean;
    horaRecordatorio?: string; // Formato "HH:mm"
    diasRecordatorio?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Domingo)
}

export interface FranjaHoraria {
    inicio: string; // Formato "HH:mm"
    fin: string;    // Formato "HH:mm"
}

export interface Entrenado {
    id: string;
    gimnasioId?: string;
    // plan free
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    entrenadoresId?: string[];
    rutinasAsignadasIds?: string[];
    // social 
    seguidores?: string[];
    seguidos?: string[];
    configNotificaciones?: ConfigNotificacion;
    // Plan Premium
    rutinasCreadas?: string[];
    ejerciciosCreadosIds?: string[];
    nivel?: NivelEntrenamiento;

    // Campos de Matching
    bio?: string;
    franjaHoraria?: FranjaHoraria;
    visibleDescubrir?: boolean;
    photoURL?: string;
}
