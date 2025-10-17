export interface Entrenador{
    id: string;          
    fechaRegistro?: Date;
    ejerciciosCreadasIds: string[];
    entrenadosAsignadosIds: string[];
    rutinasCreadasIds: string[];

}