import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WelcomePage } from './welcome.page';
import { NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

describe('WelcomePage', () => {
  let component: WelcomePage;
  let navCtrlSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    navCtrlSpy = { navigateForward: vi.fn(), };
    routerSpy = { navigate: vi.fn(), };

    TestBed.configureTestingModule({
      providers: [
        { provide: NavController, useValue: navCtrlSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    TestBed.runInInjectionContext(() => {
      component = new WelcomePage();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to register when goToRegister is called', () => {
    component.goToRegister();
    expect(navCtrlSpy.navigateForward).toHaveBeenCalledWith('/register');
  });

  it('should navigate to login when goToLogin is called', () => {
    component.goToLogin();
    expect(navCtrlSpy.navigateForward).toHaveBeenCalledWith('/login');
  });
});
