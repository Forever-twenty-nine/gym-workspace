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

/**
 * Obtiene el elemento activo real, incluso si está dentro de Shadow DOM.
 */
export function getDeepActiveElement(): Element | null {
  let activeEl = document.activeElement;
  while (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
    activeEl = activeEl.shadowRoot.activeElement;
  }
  return activeEl;
}

/**
 * Verifica si un elemento o alguno de sus ancestros (cruzando Shadow DOM)
 * está oculto o tiene aria-hidden="true".
 */
export function isElementOrAncestorHidden(el: Element): boolean {
  let current: Element | null = el;
  while (current) {
    if (
      current.getAttribute('aria-hidden') === 'true' ||
      current.classList.contains('ion-page-hidden') ||
      current.hasAttribute('ion-page-hidden')
    ) {
      return true;
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      current = parent;
    } else {
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host;
      } else {
        current = null;
      }
    }
  }
  return false;
}

/**
 * Asegura que ningún elemento enfocado quede dentro de un contenedor oculto/aria-hidden.
 * Útil después de navegaciones o cambios de visibilidad de páginas.
 */
export function checkAndFixHiddenFocus(): void {
  const activeEl = getDeepActiveElement();
  if (activeEl && activeEl !== document.body) {
    if (isElementOrAncestorHidden(activeEl)) {
      (activeEl as HTMLElement).blur?.();
    }
  }
}

