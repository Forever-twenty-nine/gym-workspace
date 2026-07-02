import { Component, inject, input, computed, Signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Plan, User, Rol } from 'gym-library';

/**
 * Imagen premium asignada a cada rol. Se exporta para que las stories / tests
 * puedan referenciarla sin acoplarse a las URLs internas.
 */
export const BG_IMAGES: Record<Rol, string> = {
  [Rol.ENTRENADO]: 'assets/images/test-gym-1.jpg',
  [Rol.ENTRENADOR]: 'assets/images/trainer-bg.png',
  [Rol.PERSONAL_TRAINER]: 'assets/images/trainer-bg.png',
  [Rol.GIMNASIO]: 'assets/images/gym-social-bg.png',
};

/**
 * Background reutilizable. Resuelve todo de forma autónoma a partir del
 * usuario autenticado en `AuthService`:
 *  - La imagen premium se elige según `user.role`.
 *  - El estado premium se calcula desde `user.plan === Plan.PREMIUM`.
 *
 * Ambos pueden sobreescribirse vía inputs cuando hace falta (p.ej. en
 * stories con un usuario mockeado, o en un caso puntual donde la fuente
 * de verdad no sea el AuthService).
 */
@Component({
  selector: 'app-background',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './background.component.html',
})
export class BackgroundComponent {
  private authService = inject(AuthService);

  /** Override de imagen. Si se omite, se resuelve por rol. */
  readonly image = input<string | null>(null);

  /**
   * Override de premium. Si se omite (`null`), se calcula desde el AuthService.
   */
  readonly isPremium = input<boolean | null>(null);

  private readonly currentUser = this.authService.currentUser as Signal<User | null>;

  /** Imagen efectiva: override explícito o la del rol actual. */
  protected readonly effectiveImage = computed<string | null>(() => {
    const override = this.image();
    if (override !== null) return override;
    const user = this.currentUser();
    return user ? BG_IMAGES[user.role as Rol] ?? null : null;
  });

  /** Bandera efectiva: override explícito o `user.plan === PREMIUM`. */
  protected readonly isPremiumEffective = computed<boolean>(() => {
    const override = this.isPremium();
    if (override !== null) return override;
    return this.currentUser()?.plan === Plan.PREMIUM;
  });
}
