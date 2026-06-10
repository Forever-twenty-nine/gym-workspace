/**
 * Representa una tarjeta del mazo de sugerencias en la pantalla Descubrir.
 * Puede ser de tipo horario o afinidad.
 */
export interface TarjetaDescubrir {
  id: string;
  tipo: 'horario' | 'afinidad' | 'general';
  data: any;
  photoURL?: string | null;
}

/**
 * Datos del match mutuo que se muestran en el popup de éxito.
 */
export interface MatchActual {
  partnerId: string;
  partnerName: string;
  partnerPhoto: string | null;
  tipo: 'horario' | 'afinidad' | 'general';
  mensaje: string;
}
