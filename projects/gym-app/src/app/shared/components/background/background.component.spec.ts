import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackgroundComponent, BG_IMAGES } from './background.component';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';
import { User, Rol, Plan } from 'gym-library';

describe('BackgroundComponent', () => {
  let component: BackgroundComponent;
  let fixture: ComponentFixture<BackgroundComponent>;
  let mockAuthService: Partial<AuthService>;
  let currentUserSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal<User | null>({ role: Rol.ENTRENADO, plan: Plan.FREE } as User);
    
    mockAuthService = {
      currentUser: currentUserSignal
    };

    await TestBed.configureTestingModule({
      imports: [BackgroundComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('effectiveImage', () => {
    it('should return image override if provided', () => {
      fixture.componentRef.setInput('image', 'custom.jpg');
      fixture.detectChanges();
      // Need to cast to any to test protected property or we can test html output
      const html = fixture.nativeElement.innerHTML;
      // Since it's free plan by default, isPremium is false, so it won't render the image
      // Let's set isPremium to true to test the image
      fixture.componentRef.setInput('isPremium', true);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.src).toContain('custom.jpg');
    });

    it('should return role image if no override and user exists', () => {
      currentUserSignal.set({ role: Rol.GIMNASIO, plan: Plan.PREMIUM } as User);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img.src).toContain(BG_IMAGES[Rol.GIMNASIO]);
    });

    it('should fall back to gradient if no user', () => {
      currentUserSignal.set(null);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeNull();
    });
  });

  describe('isPremiumEffective', () => {
    it('should return override if provided', () => {
      fixture.componentRef.setInput('isPremium', true);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy(); // Since role is ENTRENADO and we forced premium
    });

    it('should return true if user plan is PREMIUM', () => {
      currentUserSignal.set({ role: Rol.ENTRENADO, plan: Plan.PREMIUM } as User);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy();
    });

    it('should return false if user plan is FREE', () => {
      currentUserSignal.set({ role: Rol.ENTRENADO, plan: Plan.FREE } as User);
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeNull();
    });
  });
});
