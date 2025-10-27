import { SocialSharePanelComponent } from './social-share-panel.component';
import { SocialShareService } from '../../services/social-share.service';
import { signal } from '@angular/core';

describe('SocialSharePanelComponent', () => {
  let component: SocialSharePanelComponent;
  let mockSocialShareService: jest.Mocked<SocialShareService>;
  let urlCounter = 0;

  beforeEach(() => {
    // Silenciar console.error durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock URL.createObjectURL and URL.revokeObjectURL
    (URL as any).createObjectURL = jest.fn(() => `blob:mock-url-${++urlCounter}`);
    (URL as any).revokeObjectURL = jest.fn();

    mockSocialShareService = {
      generateProgressImage: jest.fn(),
      generateAndShare: jest.fn(),
    } as any;

    component = new SocialSharePanelComponent();
    // Mock the inject function to return our mock service
    (component as any).socialShareService = mockSocialShareService;
    
    // Mock inputs with signals
    (component as any).entrenadoId = signal('entrenado-123');
    (component as any).showPreview = signal(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(component.isGenerating()).toBe(false);
      expect(component.previewUrl()).toBeNull();
      expect(component.includeStats()).toBe(true);
      expect(component.includeLevel()).toBe(true);
      expect(component.includeStreak()).toBe(true);
    });

    it('should have all platforms configured', () => {
      expect(component.platforms).toHaveLength(4);
      expect(component.platforms.map(p => p.name)).toEqual([
        'instagram',
        'facebook',
        'twitter',
        'whatsapp',
      ]);
    });
  });

  describe('generatePreview()', () => {
    it('should generate preview successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockSocialShareService.generateProgressImage.mockResolvedValue(mockBlob);

      await component.generatePreview();

      expect(component.isGenerating()).toBe(false);
      expect(mockSocialShareService.generateProgressImage).toHaveBeenCalledWith(
        'entrenado-123',
        {
          includeStats: true,
          includeLevel: true,
          includeStreak: true,
        }
      );
      expect(component.previewUrl()).toMatch(/^blob:/);
    });

    it('should set isGenerating to true during generation', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      let resolvePromise: (value: Blob) => void;
      const promise = new Promise<Blob>((resolve) => {
        resolvePromise = resolve;
      });
      mockSocialShareService.generateProgressImage.mockReturnValue(promise);

      const generatePromise = component.generatePreview();
      expect(component.isGenerating()).toBe(true);

      resolvePromise!(mockBlob);
      await generatePromise;
      expect(component.isGenerating()).toBe(false);
    });

    it('should revoke previous URL when regenerating preview', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockSocialShareService.generateProgressImage.mockResolvedValue(mockBlob);

      // Primera generación
      await component.generatePreview();
      const firstUrl = component.previewUrl();

      // Segunda generación
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
      await component.generatePreview();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(firstUrl);
      expect(component.previewUrl()).not.toBe(firstUrl);

      revokeObjectURLSpy.mockRestore();
    });

    it('should handle errors during preview generation', async () => {
      const error = new Error('Failed to generate preview');
      mockSocialShareService.generateProgressImage.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.generatePreview();

      expect(component.isGenerating()).toBe(false);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
      expect(component.previewUrl()).toBeNull();
    });

    it('should use custom options when generating preview', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      mockSocialShareService.generateProgressImage.mockResolvedValue(mockBlob);

      component.includeStats.set(false);
      component.includeLevel.set(false);
      component.includeStreak.set(false);

      await component.generatePreview();

      expect(mockSocialShareService.generateProgressImage).toHaveBeenCalledWith(
        'entrenado-123',
        {
          includeStats: false,
          includeLevel: false,
          includeStreak: false,
        }
      );
    });
  });

  describe('shareOn()', () => {
    it('should share on instagram successfully', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      await component.shareOn('instagram');

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
        'entrenado-123',
        'instagram',
        {
          includeStats: true,
          includeLevel: true,
          includeStreak: true,
        }
      );
      expect(shareCompleteSpy).toHaveBeenCalledWith('instagram');
      expect(component.isGenerating()).toBe(false);
    });

    it('should share on all platforms', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const platforms = ['instagram', 'facebook', 'twitter', 'whatsapp'] as const;

      for (const platform of platforms) {
        await component.shareOn(platform);
        expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
          'entrenado-123',
          platform,
          expect.any(Object)
        );
      }

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledTimes(4);
    });

    it('should set isGenerating during share', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockSocialShareService.generateAndShare.mockReturnValue(promise);

      const sharePromise = component.shareOn('facebook');
      expect(component.isGenerating()).toBe(true);

      resolvePromise!();
      await sharePromise;
      expect(component.isGenerating()).toBe(false);
    });

    it('should handle errors during share', async () => {
      const error = new Error('Failed to share');
      mockSocialShareService.generateAndShare.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.shareOn('twitter');

      expect(component.isGenerating()).toBe(false);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should use custom options when sharing', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      component.includeStats.set(false);
      component.includeLevel.set(true);
      component.includeStreak.set(false);

      await component.shareOn('whatsapp');

      expect(mockSocialShareService.generateAndShare).toHaveBeenCalledWith(
        'entrenado-123',
        'whatsapp',
        {
          includeStats: false,
          includeLevel: true,
          includeStreak: false,
        }
      );
    });
  });

  describe('Customization Options', () => {
    it('should toggle includeStats', () => {
      expect(component.includeStats()).toBe(true);
      component.includeStats.set(false);
      expect(component.includeStats()).toBe(false);
      component.includeStats.set(true);
      expect(component.includeStats()).toBe(true);
    });

    it('should toggle includeLevel', () => {
      expect(component.includeLevel()).toBe(true);
      component.includeLevel.set(false);
      expect(component.includeLevel()).toBe(false);
    });

    it('should toggle includeStreak', () => {
      expect(component.includeStreak()).toBe(true);
      component.includeStreak.set(false);
      expect(component.includeStreak()).toBe(false);
    });
  });

  describe('Output Events', () => {
    it('should emit shareComplete on successful share', async () => {
      mockSocialShareService.generateAndShare.mockResolvedValue();

      const shareCompleteSpy = jest.fn();
      component.shareComplete.subscribe(shareCompleteSpy);

      await component.shareOn('instagram');

      expect(shareCompleteSpy).toHaveBeenCalledTimes(1);
      expect(shareCompleteSpy).toHaveBeenCalledWith('instagram');
    });

    it('should emit shareError on failed share', async () => {
      const error = new Error('Network error');
      mockSocialShareService.generateAndShare.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.shareOn('facebook');

      expect(shareErrorSpy).toHaveBeenCalledTimes(1);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should emit shareError on failed preview', async () => {
      const error = new Error('Preview error');
      mockSocialShareService.generateProgressImage.mockRejectedValue(error);

      const shareErrorSpy = jest.fn();
      component.shareError.subscribe(shareErrorSpy);

      await component.generatePreview();

      expect(shareErrorSpy).toHaveBeenCalledTimes(1);
      expect(shareErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('getShareOptions (private)', () => {
    it('should return correct options based on signals', () => {
      component.includeStats.set(false);
      component.includeLevel.set(true);
      component.includeStreak.set(false);

      const options = (component as any).getShareOptions();

      expect(options).toEqual({
        includeStats: false,
        includeLevel: true,
        includeStreak: false,
      });
    });
  });
});
