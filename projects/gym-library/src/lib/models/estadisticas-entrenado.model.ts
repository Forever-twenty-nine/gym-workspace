export interface EstadisticasEntrenado {
    // Contador de rutinas completadas
    totalRutinasCompletadas: number;
    // Racha de entrenamiento
    rachaActual: number; // Días consecutivos
    mejorRacha: number;
    ultimaFechaEntrenamiento?: Date;
    // Nivel de usuario
    nivel: number;
    experiencia: number; // XP acumulado
    experienciaProximoNivel: number;
}
