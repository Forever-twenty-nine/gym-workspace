import { Injectable } from '@angular/core';

/**
 * Servicio para ejecutar código de forma consistente.
 * En modo Zoneless (Angular 21), este servicio simplemente ejecuta el código directamente,
 * ya que no hay zonas de Angular que gestionar.
 */
@Injectable({
  providedIn: 'root'
})
export class ZoneRunnerService {
  constructor() { }

  /**
   * Ejecuta el código proporcionado.
   */
  run<T>(fn: () => T): T {
    return fn();
  }

  /**
   * Ejecuta el código proporcionado.
   */
  runOutside<T>(fn: () => T): T {
    return fn();
  }
}
