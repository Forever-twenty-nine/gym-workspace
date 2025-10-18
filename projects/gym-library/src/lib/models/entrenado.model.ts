import { Objetivo } from '../enums/objetivo.enum';
import { ProgresoRutina } from './progreso-rutina.model';
import { EstadisticasEntrenado } from './estadisticas-entrenado.model';

export interface Entrenado {
    id: string;
    fechaRegistro?: Date;
    objetivo?: Objetivo;
    entrenadoresId?: string[];
    rutinasAsignadas?: string[];
    // Progreso de rutinas
    progresoRutinas?: ProgresoRutina[];
    // Estadísticas generales
    estadisticas?: EstadisticasEntrenado;
    // Plan Premium
    rutinasCreadas?: string[];
}
