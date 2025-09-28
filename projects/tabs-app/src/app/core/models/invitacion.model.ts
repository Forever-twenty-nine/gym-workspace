export interface Invitacion {
  id?: string;
  invitadorId: string
  email: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fechaEnvio: Date;
  fechaRespuesta?: Date;
  mensaje?: string;
  franjaHoraria?: 'mañana' | 'tarde' | 'noche';

}
