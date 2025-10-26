import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { SocialShareService, ShareProgressOptions } from '../services/social-share.service';

/**
 * Componente de botón para compartir progreso en redes sociales
 * 
 * @example
 * ```html
 * <lib-social-share-button
 *   [entrenadoId]="entrenadoId()"
 *   platform="instagram"
 *   [disabled]="loading()"
 *   (shareComplete)="onShareComplete()"
 *   (shareError)="onShareError($event)">
 *   Compartir en Instagram
 * </lib-social-share-button>
 * ```
 */
@Component({
  selector: 'lib-social-share-button',
  standalone: true,
  template: `
    <button
      type="button"
      [disabled]="disabled() || isSharing()"
      (click)="handleShare()">
      @if (isSharing()) {
        <span>Generando...</span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareButtonComponent {
  private readonly socialShareService = inject(SocialShareService);

  // Inputs
  readonly entrenadoId = input.required<string>();
  readonly platform = input.required<'instagram' | 'facebook' | 'twitter' | 'whatsapp'>();
  readonly disabled = input<boolean>(false);
  readonly options = input<ShareProgressOptions>({});

  // Outputs
  readonly shareComplete = output<void>();
  readonly shareError = output<Error>();

  // Estado interno
  readonly isSharing = signal(false);

  async handleShare(): Promise<void> {
    if (this.disabled() || this.isSharing()) {
      return;
    }

    this.isSharing.set(true);

    try {
      await this.socialShareService.generateAndShare(
        this.entrenadoId(),
        this.platform(),
        this.options()
      );
      this.shareComplete.emit();
    } catch (error) {
      console.error('Error al compartir:', error);
      this.shareError.emit(error as Error);
    } finally {
      this.isSharing.set(false);
    }
  }
}
