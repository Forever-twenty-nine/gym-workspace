import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingPage } from './onboarding.page';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { GimnasioService } from '../../core/services/gimnasio.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

describe('OnboardingPage', () => {
  let component: OnboardingPage;
  let fixture: ComponentFixture<OnboardingPage>;
  
  let authServiceSpy: any;
  let userServiceSpy: any;
  let entrenadoServiceSpy: any;
  let entrenadorServiceSpy: any;
  let gimnasioServiceSpy: any;
  let routerSpy: any;
  let toastCtrlSpy: any;

  beforeEach(async () => {
    authServiceSpy = { currentUser: vi.fn() };
    userServiceSpy = { updateUser: vi.fn() };
    entrenadoServiceSpy = { save: vi.fn() };
    entrenadorServiceSpy = { createWithId: vi.fn() };
    gimnasioServiceSpy = { save: vi.fn() };
    routerSpy = { navigate: vi.fn() };
    toastCtrlSpy = { create: vi.fn() };

    const toastSpy = { present: vi.fn() };
    toastCtrlSpy.create.mockReturnValue(Promise.resolve(toastSpy as any));

    await TestBed.configureTestingModule({
      imports: [OnboardingPage, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: EntrenadoService, useValue: entrenadoServiceSpy },
        { provide: EntrenadorService, useValue: entrenadorServiceSpy },
        { provide: GimnasioService, useValue: gimnasioServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastController, useValue: toastCtrlSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not allow moving to next step if name is empty', () => {
    component.formData.update(data => ({ ...data, nombre: '' }));
    component.nextStep();
    expect(component.currentStep()).toBe(1);
    expect(toastCtrlSpy.create).toHaveBeenCalled();
  });

  it('should allow moving to step 2 if name is provided and role is entrenado', () => {
    component.formData.update(data => ({ ...data, nombre: 'Test User', role: 'entrenado' }));
    component.nextStep();
    expect(component.currentStep()).toBe(2);
  });

  it('should complete onboarding immediately if role is not entrenado', async () => {
    authServiceSpy.currentUser.mockReturnValue({ uid: 'test-uid' } as any);
    userServiceSpy.updateUser.mockReturnValue(Promise.resolve());
    entrenadorServiceSpy.createWithId.mockReturnValue(Promise.resolve() as any);
    
    component.formData.update(data => ({ ...data, nombre: 'Trainer User', role: 'entrenador' }));
    component.nextStep();
    await new Promise(r => setTimeout(r, 0));

    expect(userServiceSpy.updateUser).toHaveBeenCalled();
    expect(entrenadorServiceSpy.createWithId).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/entrenador-tabs']);
  });

  it('should validate step 2 objective for entrenado', async () => {
    authServiceSpy.currentUser.mockReturnValue({ uid: 'test-uid' } as any);
    userServiceSpy.updateUser.mockReturnValue(Promise.resolve());
    entrenadoServiceSpy.save.mockReturnValue(Promise.resolve() as any);

    component.formData.update(data => ({ ...data, nombre: 'Test', role: 'entrenado' }));
    component.nextStep(); 
    expect(component.currentStep()).toBe(2);

    component.formData.update(data => ({ ...data, objetivo: 'SALUD' }));
    component.nextStep();
    await new Promise(r => setTimeout(r, 0));

    expect(entrenadoServiceSpy.save).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/entrenado-tabs']);
  });
});
