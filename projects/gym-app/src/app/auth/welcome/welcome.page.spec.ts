import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomePage } from './welcome.page';
import { NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

describe('WelcomePage', () => {
  let component: WelcomePage;
  let fixture: ComponentFixture<WelcomePage>;
  let navCtrlSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    // Note: If using Vitest with Jasmine compatibility, this syntax works.
    // If not, we might need to use vi.fn() or jasmine.createSpyObj depending on the setup.
    // Assuming standard Angular testing setup which polyfills/supports Jasmine spies or Vitest equivalents.
    navCtrlSpy = { navigateForward: vi.fn(), };
    routerSpy = { navigate: vi.fn(), };

    await TestBed.configureTestingModule({
      imports: [WelcomePage],
      providers: [
        { provide: NavController, useValue: navCtrlSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
