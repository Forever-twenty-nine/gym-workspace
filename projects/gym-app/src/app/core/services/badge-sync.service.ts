import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 🔔 BadgeSyncService — sincroniza el contador de notificaciones no leídas
 * con el badge del sistema operativo (icono del launcher / dock) usando la
 * **Web Badging API** del navegador.
 *
 * ✅ Como esta app es PWA hoy, NO usamos plugins de Capacitor. La Web
 * Badging API (`navigator.setAppBadge(count)`) ya viene incluida en
 * Chrome / Edge (desktop y Android), y es 100% estándar W3C.
 *
 * Si en el futuro se compila como nativa (Android/iOS con Capacitor):
 *  - Para el badge del launcher: instalar `@capacitor-community/badge`
 *    y wirear su método `Badge.set({ count })` dentro de `applyToOs`.
 *  - Para push notifications reales (FCM / APNs): el backend ya tiene
 *    Firebase, así que con `@capacitor/push-notifications` alcanza.
 *
 * El diseño del servicio es "tonto": recibe un contador y lo refleja.
 * Cualquier consumidor puede leer `count()` reactivamente para mostrar
 * su propio indicador (campanita del perfil, badge de un tab, etc.).
 */
@Injectable({
  providedIn: 'root'
})
export class BadgeSyncService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Último contador aplicado. Signal público para que múltiples
   *  consumidores (campanita, tab badge, etc.) se mantengan en sync. */
  private readonly _count = signal<number>(0);
  readonly count = this._count.asReadonly();

  /**
   * Setea el contador de notificaciones no leídas y lo refleja en el SO.
   * Es seguro llamar en cualquier plataforma: si la Web Badging API no
   * está disponible (Safari iOS, Firefox, etc.), hace no-op silencioso.
   */
  async setCount(value: number): Promise<void> {
    const normalized = Math.max(0, Math.floor(value));
    if (this._count() === normalized) return;

    this._count.set(normalized);
    await this.applyToOs(normalized);
  }

  /** Limpia el badge del SO y el signal. */
  async clear(): Promise<void> {
    await this.setCount(0);
  }

  /**
   * Aplica el contador al SO usando la Web Badging API.
   * No-op fuera del navegador o si la API no está disponible.
   */
  private async applyToOs(value: number): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const nav = navigator as Navigator & {
      setAppBadge?: (count?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    try {
      if (value <= 0) {
        if (typeof nav.clearAppBadge === 'function') {
          await nav.clearAppBadge();
        }
      } else {
        if (typeof nav.setAppBadge === 'function') {
          await nav.setAppBadge(value);
        }
      }
    } catch (err) {
      console.warn('⚠️ BadgeSyncService: no se pudo sincronizar el badge del SO', err);
    }
  }
}