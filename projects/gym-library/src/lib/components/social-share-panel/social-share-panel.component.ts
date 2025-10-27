import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { SocialShareService, ShareProgressOptions } from '../../services/social-share.service';
import { SocialShareButtonComponent } from '../social-share-button/social-share-button.component';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp';

@Component({
  selector: 'lib-social-share-panel',
  templateUrl: './social-share-panel.component.html',
  styleUrl: './social-share-panel.component.css',
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
