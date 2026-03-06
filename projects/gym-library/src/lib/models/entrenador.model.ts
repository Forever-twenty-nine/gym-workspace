export interface Entrenador {
    id: string;
    // plan free
    fechaRegistro?: Date;
    //asociaciones
    ejerciciosCreadasIds: string[];
    entrenadosAsignadosIds: string[];
    rutinasCreadasIds: string[];
    // plan premium
    entrenadosPremiumIds: string[];
}