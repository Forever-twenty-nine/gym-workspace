import { inject, Injector, runInInjectionContext } from '@angular/core';
import { ZoneRunnerService } from './zone-runner.service';

/**
 * Clase base para adapters de Firebase que necesitan ejecutar callbacks en el contexto correcto de Angular.
 * Proporciona un método helper para ejecutar código en el contexto de inyección de Angular de forma segura.
 */
export abstract class FirebaseAdapterBase {
  protected zoneRunner = inject(ZoneRunnerService, { optional: true });
  protected injector = inject(Injector);

  /**
   * Ejecuta el callback proporcionado en el contexto correcto de Angular.
   * En aplicaciones con zonas, usa NgZone. En aplicaciones zoneless, usa runInInjectionContext.
   */
  protected runInZone<T extends any[], R>(callback: (...args: T) => R, ...args: T): R {
    // Si tenemos ZoneRunnerService disponible (aplicaciones con zonas), úsalo
    if (this.zoneRunner) {
      return this.zoneRunner.run(() => callback(...args));
    }
    
    // Para aplicaciones zoneless, usa runInInjectionContext
    return runInInjectionContext(this.injector, () => callback(...args));
  }
}