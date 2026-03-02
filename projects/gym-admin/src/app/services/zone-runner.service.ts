import { Injectable } from '@angular/core';

/**
 * Servicio adaptado para Angular 21 Zoneless.
 * En modo zoneless, NgZone ya no es necesario, por lo que este servicio
 * ahora simplemente ejecuta las funciones directamente.
 */
@Injectable({
  providedIn: 'root'
})
export class ZoneRunnerService {
  /**
   * Ejecuta el código proporcionado directamente (ya no requiere NgZone).
   */
  run<T>(fn: () => T): T {
    return fn();
  }

  /**
   * Ejecuta el código proporcionado directamente (ya no requiere NgZone).
   */
  runOutside<T>(fn: () => T): T {
    return fn();
  }
}