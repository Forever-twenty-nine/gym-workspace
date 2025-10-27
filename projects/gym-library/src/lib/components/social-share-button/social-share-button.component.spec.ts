import { SocialShareButtonComponent } from './social-share-button.component';
import { SocialShareService } from '../../services/social-share.service';
import { signal } from '@angular/core';

describe('SocialShareButtonComponent', () => {
  let component: SocialShareButtonComponent;
  let mockSocialShareService: jest.Mocked<SocialShareService>;

  beforeEach(() => {
    // Silenciar console.error durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSocialShareService = {
      generateAndShare: jest.fn(),
      generateProgressImage: jest.fn(),
    } as any;

    component = new SocialShareButtonComponent();
    // Mock the inject function to return our mock service
    (component as any).socialShareService = mockSocialShareService;
    
    // Mock inputs with signals
    (component as any).entrenadoId = signal('entrenado-123');
    (component as any).platform = signal('instagram' as any);
    (component as any).disabled = signal(false);
    (component as any).options = signal({});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize isSharing as false', () => {
      expect(component.isSharing()).toBe(false);
    });
  });

  describe('handleShare()', () => {
    it('should share successfully', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      await component.handleShare();

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
        'entrenado-123',
        'instagram',
        {}
      );
      expect(shareCompleteSpy).toHaveBeenCalledTimes(1);
      expect(component.isSharing()).toBe(false);
    });

    it('should set isSharing to true during share', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockSocialShareService.generateAndShare.mockReturnValue(promise);

      const sharePromise = component.handleShare();
      expect(component.isSharing()).toBe(true);

      resolvePromise!();
      await sharePromise;
      expect(component.isSharing()).toBe(false);
    });

    it('should pass custom options to service', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const customOptions = {
        includeStats: false,
        includeLevel: true,
        includeStreak: false,
      };
      
      (component as any).options = signal(customOptions);

      await component.handleShare();

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
        'entrenado-123',
        'instagram',
        customOptions
      );
    });

    it('should handle errors during share', async () => {
      const error = new Error('Failed to share');
      mockSocialShareService.generateAndShare.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.handleShare();

      expect(component.isSharing()).toBe(false);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should not share when disabled is true', async () => {
      (component as any).disabled = signal(true);

      await component.handleShare();

      expect(mockSocialShareService.generateAndShare).not.toHaveBeenCalled();
      expect(component.isSharing()).toBe(false);
    });

    it('should not share when already sharing', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockSocialShareService.generateAndShare.mockReturnValue(promise);

      // Primera llamada
      const firstShare = component.handleShare();
      expect(component.isSharing()).toBe(true);

      // Segunda llamada mientras está compartiendo
      await component.handleShare();
      
      // El servicio solo debería haberse llamado una vez
      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledTimes(1);

      resolvePromise!();
      await firstShare;
    });

    it('should share on different platforms', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const platforms = ['instagram', 'facebook', 'twitter', 'whatsapp'] as const;

      for (const platform of platforms) {
        (component as any).platform = signal(platform);

        await component.handleShare();

        expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
          'entrenado-123',
          platform,
          {}
        );
      }

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledTimes(4);
    });

    it('should reset isSharing even after error', async () => {
      const error = new Error('Network error');
      mockSocialShareService.generateAndShare.mockRejectedValue(error);

      await component.handleShare();

      expect(component.isSharing()).toBe(false);
    });

    it('should handle rapid multiple clicks', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      // Simular múltiples clicks rápidos
      const promises = [
        component.handleShare(),
        component.handleShare(),
        component.handleShare(),
      ];

      await Promise.all(promises);

      // Solo debe haberse llamado una vez debido a la protección isSharing
      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledTimes(1);
    });

    it('should handle different entrenadoIds', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const entrenadoIds = ['entrenado-1', 'entrenado-2', 'entrenado-3'];

      for (const id of entrenadoIds) {
        (component as any).entrenadoId = signal(id);

        await component.handleShare();

        expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
          id,
          'instagram',
          {}
        );
      }
    });
  });

  describe('Output Events', () => {
    it('should emit shareComplete on successful share', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      await component.handleShare();

      expect(shareCompleteSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit shareError on failed share', async () => {
      const error = new Error('Share failed');
      mockSocialShareService.generateAndShare.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.handleShare();

      expect(shareErrorSpy).toHaveBeenCalledTimes(1);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should not emit shareComplete when disabled', async () => {
      (component as any).disabled = signal(true);

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      await component.handleShare();

      expect(shareCompleteSpy).not.toHaveBeenCalled();
    });

    it('should not emit shareComplete when already sharing', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockSocialShareService.generateAndShare.mockReturnValue(promise);

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      // Primera llamada
      const firstShare = component.handleShare();
      
      // Segunda llamada mientras está compartiendo
      await component.handleShare();
      
      // Aún no debe haberse emitido
      expect(shareCompleteSpy).not.toHaveBeenCalled();

      resolvePromise!();
      await firstShare;

      // Solo debe emitirse una vez
      expect(shareCompleteSpy).toHaveBeenCalledTimes(1);
    });
  });
});
