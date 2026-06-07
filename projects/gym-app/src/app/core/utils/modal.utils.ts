import { WritableSignal } from '@angular/core';

/**
 * Cierra un modal con señal de apertura y limpia el elemento seleccionado
 * después del tiempo de la animación de salida de Ionic.
 *
 * Uso típico:
 *   closeModalWithAnimation(this.isOpen, this.selectedItem);
 */
export function closeModalWithAnimation<T>(
  isOpen: WritableSignal<boolean>,
  selected: WritableSignal<T | null>,
  animationMs = 280
): void {
  isOpen.set(false);
  // Dejar que la animación de salida de Ionic termine antes de limpiar el contenido
  setTimeout(() => {
    selected.set(null);
  }, animationMs);
}

/**
 * Libera el foco del elemento actualmente activo.
 * Útil antes de navegar o para forzar el cierre del teclado en móvil.
 */
export function blurActiveElement(): void {
  (document.activeElement as HTMLElement | null)?.blur?.();
}
