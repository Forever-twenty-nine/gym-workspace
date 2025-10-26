import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { SocialShareService, ShareProgressOptions } from '../services/social-share.service';
import { SocialShareButtonComponent } from './social-share-button.component';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp';

/**
 * Componente de panel para compartir progreso en múltiples redes sociales
 * Incluye opciones de personalización y preview
 * 
 * @example
 * ```html
 * <lib-social-share-panel
 *   [entrenadoId]="entrenadoId()"
 *   [showPreview]="true"
 *   (shareComplete)="onShareComplete($event)">
 * </lib-social-share-panel>
 * ```
 */
@Component({
  selector: 'lib-social-share-panel',
  standalone: true,
  template: `
    <div class="social-share-panel">
      <h3>Compartir mi progreso</h3>
      
      @if (showPreview()) {
        <div class="preview-section">
          <button type="button" (click)="generatePreview()">
            {{ previewUrl() ? 'Regenerar Preview' : 'Ver Preview' }}
          </button>
          
          @if (previewUrl()) {
            <div class="preview-container">
              <img [src]="previewUrl()" alt="Preview del progreso" />
            </div>
          }
        </div>
      }

      <div class="options-section">
        <h4>Opciones de personalización</h4>
        
        <label>
          <input
            type="checkbox"
            [checked]="includeStats()"
            (change)="includeStats.set(!includeStats())"
          />
          Incluir estadísticas
        </label>

        <label>
          <input
            type="checkbox"
            [checked]="includeLevel()"
            (change)="includeLevel.set(!includeLevel())"
          />
          Incluir nivel
        </label>

        <label>
          <input
            type="checkbox"
            [checked]="includeStreak()"
            (change)="includeStreak.set(!includeStreak())"
          />
          Incluir racha
        </label>
      </div>

      <div class="platforms-section">
        <h4>Compartir en:</h4>
        
        <div class="platform-buttons">
          @for (platform of platforms; track platform.name) {
            <button
              type="button"
              class="platform-button"
              [class]="'platform-' + platform.name"
              [disabled]="isGenerating()"
              (click)="shareOn(platform.name)">
              {{ platform.label }}
            </button>
          }
        </div>
      </div>

      <div class="watermark-notice">
        <p>ℹ️ Las imágenes compartidas incluyen un watermark.</p>
        <p>Desbloqueá exportación en PDF sin watermark con <strong>Premium</strong>.</p>
      </div>
    </div>
  `,
  styles: [`
    .social-share-panel {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
    }

    .preview-section {
      margin: 1rem 0;
    }

    .preview-container {
      margin-top: 1rem;
      max-width: 400px;
    }

    .preview-container img {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .options-section,
    .platforms-section {
      margin: 1.5rem 0;
    }

    .options-section label {
      display: block;
      margin: 0.5rem 0;
      cursor: pointer;
    }

    .options-section input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .platform-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .platform-button {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .platform-button:hover:not(:disabled) {
      opacity: 0.9;
    }

    .platform-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .platform-instagram {
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    }

    .platform-facebook {
      background: #1877f2;
    }

    .platform-twitter {
      background: #1da1f2;
    }

    .platform-whatsapp {
      background: #25d366;
    }

    .watermark-notice {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .watermark-notice p {
      margin: 0.25rem 0;
    }

    h3, h4 {
      margin: 0 0 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharePanelComponent {
  private readonly socialShareService = inject(SocialShareService);

  // Inputs
  readonly entrenadoId = input.required<string>();
  readonly showPreview = input<boolean>(true);

  // Outputs
  readonly shareComplete = output<Platform>();
  readonly shareError = output<Error>();

  // Estado
  readonly isGenerating = signal(false);
  readonly previewUrl = signal<string | null>(null);
  
  // Opciones de personalización
  readonly includeStats = signal(true);
  readonly includeLevel = signal(true);
  readonly includeStreak = signal(true);

  readonly platforms = [
    { name: 'instagram' as const, label: '📷 Instagram' },
    { name: 'facebook' as const, label: '👍 Facebook' },
    { name: 'twitter' as const, label: '🐦 Twitter' },
    { name: 'whatsapp' as const, label: '💬 WhatsApp' },
  ];

  async generatePreview(): Promise<void> {
    this.isGenerating.set(true);

    try {
      const options = this.getShareOptions();
      const blob = await this.socialShareService.generateProgressImage(
        this.entrenadoId(),
        options
      );
      
      // Liberar URL anterior si existe
      if (this.previewUrl()) {
        URL.revokeObjectURL(this.previewUrl()!);
      }
      
      const url = URL.createObjectURL(blob);
      this.previewUrl.set(url);
    } catch (error) {
      console.error('Error al generar preview:', error);
      this.shareError.emit(error as Error);
    } finally {
      this.isGenerating.set(false);
    }
  }

  async shareOn(platform: Platform): Promise<void> {
    this.isGenerating.set(true);

    try {
      const options = this.getShareOptions();
      await this.socialShareService.generateAndShare(
        this.entrenadoId(),
        platform,
        options
      );
      this.shareComplete.emit(platform);
    } catch (error) {
      console.error('Error al compartir:', error);
      this.shareError.emit(error as Error);
    } finally {
      this.isGenerating.set(false);
    }
  }

  private getShareOptions(): ShareProgressOptions {
    return {
      includeStats: this.includeStats(),
      includeLevel: this.includeLevel(),
      includeStreak: this.includeStreak(),
    };
  }
}
