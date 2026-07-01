import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ForgotPasswordPage } from './forgot-password.page';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = { sendPasswordResetEmail: vi.fn(), isLoading: vi.fn(() => false), error: vi.fn(() => null) };
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        FormBuilder
      ]
    });

    TestBed.runInInjectionContext(() => {
      component = new ForgotPasswordPage();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.forgotForm.valid).toBeFalsy();
  });

  it('should call sendPasswordResetEmail and navigate to login on success after 2 seconds', async () => {
    authServiceSpy.sendPasswordResetEmail.mockReturnValue(Promise.resolve(true));
    
    component.forgotForm.controls['email'].setValue('test@test.com');
    
    component.resetPassword();
    await new Promise(r => setTimeout(r, 0)); // wait for the promise to resolve
    
    expect(authServiceSpy.sendPasswordResetEmail).toHaveBeenCalledWith('test@test.com');
    expect(routerSpy.navigate).not.toHaveBeenCalled(); // Still waiting for setTimeout
    
    await new Promise(r => setTimeout(r, 2050));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to login when goToLogin is called', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
