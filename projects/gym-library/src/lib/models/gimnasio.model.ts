/**
 * Contiene los datos específicos del gimnasio.
 */
export interface Gimnasio {
  id: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  isPersonalTrainer?: boolean;
  entrenadoresIds?: string[];
  entrenadosIds?: string[];
}