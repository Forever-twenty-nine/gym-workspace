import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TipoEntrenamientoModalComponent } from './tipo-entrenamiento-modal';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ComponentRef } from '@angular/core';
import { AUTH, FIRESTORE } from '../../../../core/firebase.tokens';

describe('TipoEntrenamientoModalComponent', () => {
  let component: TipoEntrenamientoModalComponent;
  let fixture: ComponentFixture<TipoEntrenamientoModalComponent>;
  let componentRef: ComponentRef<TipoEntrenamientoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TipoEntrenamientoModalComponent],
      providers: [
        FormBuilder,
        { provide: AUTH, useValue: {} },
        { provide: FIRESTORE, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TipoEntrenamientoModalComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form when opened', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    
    expect(component.form()).toBeTruthy();
    expect(component.form()?.get('nombre')?.value).toBe('');
  });

  it('should initialize form with tipo data when editing', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('tipo', { id: '1', nombre: 'Yoga' });
    fixture.detectChanges();
    
    expect(component.form()?.get('nombre')?.value).toBe('Yoga');
  });

  it('should emit save with form value when onSave is called and form is valid', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    
    vi.spyOn(component.save, 'emit');
    component.form()?.patchValue({ nombre: 'Pilates' });
    
    component.onSave();
    expect(component.save.emit).toHaveBeenCalledWith('Pilates');
  });

  it('should not emit save when onSave is called and form is invalid', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    
    vi.spyOn(component.save, 'emit');
    // required validator should make form invalid with empty string
    component.form()?.patchValue({ nombre: '' }); 
    
    component.onSave();
    expect(component.save.emit).not.toHaveBeenCalled();
  });
});
