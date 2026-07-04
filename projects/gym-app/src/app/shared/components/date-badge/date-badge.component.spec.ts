import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateBadgeComponent } from './date-badge.component';

describe('DateBadgeComponent', () => {
  let component: DateBadgeComponent;
  let fixture: ComponentFixture<DateBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DateBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('diaNombre', () => {
    it('should return HOY if esEjecutable is true', () => {
      fixture.componentRef.setInput('esEjecutable', true);
      fixture.componentRef.setInput('fecha', new Date('2026-07-04T12:00:00Z'));
      fixture.detectChanges();
      expect(component.diaNombre()).toBe('HOY');
    });

    it('should format date day name if esEjecutable is false and fecha is provided', () => {
      fixture.componentRef.setInput('esEjecutable', false);
      fixture.componentRef.setInput('fecha', new Date('2026-07-04T12:00:00Z')); // Saturday
      fixture.detectChanges();
      expect(component.diaNombre()).toBe('SÁB');
    });

    it('should return diaCorto if no fecha and esEjecutable is false', () => {
      fixture.componentRef.setInput('esEjecutable', false);
      fixture.componentRef.setInput('fecha', null);
      fixture.componentRef.setInput('diaCorto', 'MAR');
      fixture.detectChanges();
      expect(component.diaNombre()).toBe('MAR');
    });

    it('should return PRÓX if no fecha, no diaCorto, and esEjecutable is false', () => {
      fixture.componentRef.setInput('esEjecutable', false);
      fixture.componentRef.setInput('fecha', null);
      fixture.componentRef.setInput('diaCorto', undefined);
      fixture.detectChanges();
      expect(component.diaNombre()).toBe('PRÓX');
    });
  });

  describe('diaNumero', () => {
    it('should return day number as string if fecha is provided', () => {
      fixture.componentRef.setInput('fecha', new Date('2026-07-04T12:00:00Z'));
      fixture.detectChanges();
      expect(component.diaNumero()).toBe('4');
    });

    it('should return empty string if no fecha provided', () => {
      fixture.componentRef.setInput('fecha', null);
      fixture.detectChanges();
      expect(component.diaNumero()).toBe('');
    });
  });

  describe('mesNombre', () => {
    it('should format date month name if fecha is provided', () => {
      fixture.componentRef.setInput('fecha', new Date('2026-07-04T12:00:00Z'));
      fixture.detectChanges();
      expect(component.mesNombre()).toBe('JUL');
    });

    it('should return empty string if no fecha provided', () => {
      fixture.componentRef.setInput('fecha', null);
      fixture.detectChanges();
      expect(component.mesNombre()).toBe('');
    });
  });
});
