import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceSpy: any;
  let storageServiceSpy: any;
  let routerSpy: any;
  let navCtrlSpy: any;

  beforeEach(async () => {
    authServiceSpy = { loginWithEmail: vi.fn(), loginWithGoogle: vi.fn(), isLoading: vi.fn(() => false), error: vi.fn(() => null), currentUser: vi.fn(() => ({ role: 'entrenado', onboarded: true })) };
    storageServiceSpy = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };
    routerSpy = { navigate: vi.fn() };
    navCtrlSpy = { navigateForward: vi.fn(), navigateRoot: vi.fn() };

    // Setup default mock returns
    storageServiceSpy.get.mockReturnValue(Promise.resolve(null));
    
    await TestBed.configureTestingModule({
      imports: [LoginPage, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NavController, useValue: navCtrlSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('email field validity', () => {
    let email = component.loginForm.controls['email'];
    expect(email.valid).toBeFalsy();

    // Required error
    expect(email.hasError('required')).toBeTruthy();

    // Set invalid email format
    email.setValue('test');
    expect(email.hasError('email')).toBeTruthy();

    // Set valid email
    email.setValue('test@example.com');
    expect(email.hasError('email')).toBeFalsy();
  });

  it('password field validity', () => {
    let password = component.loginForm.controls['password'];
    expect(password.valid).toBeFalsy();
    
    password.setValue('123456');
    expect(password.valid).toBeTruthy();
  });

  it('should call loginWithEmail on valid form submit and navigate', async () => {
    authServiceSpy.loginWithEmail.mockReturnValue(Promise.resolve(true));
    authServiceSpy.currentUser.mockReturnValue({ role: 'entrenado', onboarded: true } as any);
    
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password123');
    component.loginForm.controls['rememberMe'].setValue(false);

    component.login();
    await new Promise(r => setTimeout(r, 0));

    expect(authServiceSpy.loginWithEmail).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(navCtrlSpy.navigateRoot).toHaveBeenCalledWith('/entrenado-tabs');
  });

  it('should save credentials if rememberMe is true', async () => {
    authServiceSpy.loginWithEmail.mockReturnValue(Promise.resolve(true));
    authServiceSpy.currentUser.mockReturnValue({ role: 'entrenado', onboarded: true } as any);
    
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password123');
    component.loginForm.controls['rememberMe'].setValue(true);

    component.login();
    await new Promise(r => setTimeout(r, 0));

    expect(storageServiceSpy.set).toHaveBeenCalledWith('remembered_credentials', { email: 'test@test.com', password: 'password123' });
  });
});
