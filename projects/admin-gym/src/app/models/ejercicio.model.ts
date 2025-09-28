/**
 * Ejercicio dentro de una rutina de entrenamiento.
 */

export interface Ejercicio {
    id: string;
    nombre: string;
    descripcion?: string;
    series: number;
    repeticiones: number;
    peso?: number;
    descansoSegundos?: number;
    serieSegundos?: number;
}
