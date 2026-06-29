export interface Entrenador {
    id: string;
    // Profile body
    gimnasioId?: string[];
    descripcion?: string;
    entrenadosIds: string[];
    // Asociaciones
    ejerciciosCreadasIds: string[];
    entrenadosAsignadosIds: string[];
    rutinasCreadasIds: string[];
}