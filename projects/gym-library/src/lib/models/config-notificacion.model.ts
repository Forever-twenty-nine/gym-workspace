export interface ConfigNotificacion {
    recordatoriosEntrenamiento: boolean;
    horaRecordatorio?: string; // Formato "HH:mm"
    diasRecordatorio?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Domingo)
}