export interface Gimnasio {
  id: string;
  // Profile body
  direccion: string;
  isPersonalTrainer?: boolean;
  // Premium
  cobraMensualidad?: boolean;
  // Asociaciones
  entrenadoresIds?: string[];
  entrenadosIds?: string[];
}