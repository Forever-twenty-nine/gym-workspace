import { Injectable, NgZone, inject, Injector } from '@angular/core';

/**
 * Servicio opcional para ejecutar código en la zona correcta de Angular.
 * Este servicio es opcional y solo se registra cuando NgZone está disponible.
 */
@Injectable({
  providedIn: 'root'
})
export class ZoneRunnerService {
  private ngZone?: NgZone;

  constructor(private injector: Injector) {
    try {
      // Intentar inyectar NgZone, pero no fallar si no está disponible
      this.ngZone = injector.get(NgZone, undefined, { optional: true }) || undefined;
    } catch {
      // NgZone no disponible, continuar sin él
    }
  }

  /**
   * Ejecuta el código proporcionado en la zona de Angular si NgZone está disponible.
   * Si no está disponible, ejecuta el código normalmente.
   */
  run<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.run(fn);
    }
    return fn();
  }

  /**
   * Ejecuta el código proporcionado fuera de la zona de Angular si NgZone está disponible.
   * Si no está disponible, ejecuta el código normalmente.
   */
  runOutside<T>(fn: () => T): T {
    if (this.ngZone) {
      return this.ngZone.runOutsideAngular(fn);
    }
    return fn();
  }
}