import { Objetivo } from '../enums/objetivo.enum';
import { NivelEntrenamiento } from '../enums/nivel-entrenamiento.enum';
import { ConfigNotificacion } from './config-notificacion.model';
import { FranjaHoraria } from './franja-horaria.model';

export interface Entrenado {
    id: string;
    // Profile body
    gimnasioId?: string[];
    objetivo?: Objetivo; 
    entrenadoresId?: string[];// Asociacion con entrenadores
    rutinasAsignadasIds?: string[];
    // Social 
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
    photoSocialURL?: string; // Foto para social
}
