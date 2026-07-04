import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthBackgroundComponent } from './auth-background.component';
import { ComponentRef } from '@angular/core';

describe('AuthBackgroundComponent', () => {
  let component: AuthBackgroundComponent;
  let fixture: ComponentFixture<AuthBackgroundComponent>;
  let componentRef: ComponentRef<AuthBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthBackgroundComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthBackgroundComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default inputs', () => {
    expect(component.opacityClass).toBe(' ');
    expect(component.showBlur).toBe(true);
  });

  it('should update inputs', () => {
    componentRef.setInput('opacityClass', 'bg-opacity-50');
    componentRef.setInput('showBlur', false);
    fixture.detectChanges();
    expect(component.opacityClass).toBe('bg-opacity-50');
    expect(component.showBlur).toBe(false);
  });
});
