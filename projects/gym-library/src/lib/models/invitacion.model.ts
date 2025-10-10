export interface Invitacion {
  id?: string;
  entrenadorId: string;  // ID del entrenador que envía la invitación
  entrenadoId: string;   // ID del entrenado invitado
  email: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fechaEnvio: Date;
  fechaRespuesta?: Date;
  mensaje?: string;
  franjaHoraria?: 'mañana' | 'tarde' | 'noche';
}
