import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = { registerWithEmail: vi.fn(), loginWithGoogle: vi.fn(), isLoading: vi.fn(() => false), error: vi.fn(() => null), currentUser: vi.fn(() => null) };
    routerSpy = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        FormBuilder
      ]
    });

    TestBed.runInInjectionContext(() => {
      component = new RegisterPage();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should validate email format', () => {
    let email = component.registerForm.controls['email'];
    email.setValue('invalid-email');
    expect(email.hasError('email')).toBeTruthy();
    
    email.setValue('test@test.com');
    expect(email.hasError('email')).toBeFalsy();
  });

  it('should validate password length', () => {
    let password = component.registerForm.controls['password'];
    password.setValue('123'); // short
    expect(password.hasError('minlength')).toBeTruthy();

    password.setValue('123456'); // valid
    expect(password.hasError('minlength')).toBeFalsy();
  });

  it('should validate password match', () => {
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['confirmPassword'].setValue('different');
    
    // Trigger validation
    component.registerForm.updateValueAndValidity();
    
    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();

    component.registerForm.controls['confirmPassword'].setValue('password123');
    expect(component.registerForm.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should not call registerWithEmail if form is invalid', async () => {
    component.register();
    await new Promise(r => setTimeout(r, 0));
    expect(authServiceSpy.registerWithEmail).not.toHaveBeenCalled();
  });

  it('should call registerWithEmail and navigate on success', async () => {
    authServiceSpy.registerWithEmail.mockReturnValue(Promise.resolve(true));
    
    component.registerForm.controls['email'].setValue('test@test.com');
    component.registerForm.controls['password'].setValue('password123');
    component.registerForm.controls['confirmPassword'].setValue('password123');

    await component.register();

    expect(authServiceSpy.registerWithEmail).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/onboarding']);
  });
});
