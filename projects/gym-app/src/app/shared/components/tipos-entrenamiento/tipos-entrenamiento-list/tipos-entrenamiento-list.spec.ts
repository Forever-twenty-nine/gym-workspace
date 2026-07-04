import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiposEntrenamientoListComponent } from './tipos-entrenamiento-list';
import { TipoEntrenamiento } from 'gym-library';

describe('TiposEntrenamientoListComponent', () => {
  let component: TiposEntrenamientoListComponent;
  let fixture: ComponentFixture<TiposEntrenamientoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposEntrenamientoListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TiposEntrenamientoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit edit event', () => {
    const mockTipo: TipoEntrenamiento = { id: '1', nombre: 'Fuerza' };
    vi.spyOn(component.edit, 'emit');
    component.onEdit(mockTipo);
    expect(component.edit.emit).toHaveBeenCalledWith(mockTipo);
  });

  it('should emit delete event', () => {
    const mockTipo: TipoEntrenamiento = { id: '1', nombre: 'Fuerza' };
    vi.spyOn(component.delete, 'emit');
    component.onDelete(mockTipo);
    expect(component.delete.emit).toHaveBeenCalledWith(mockTipo);
  });

  it('should emit loadDefaults event', () => {
    vi.spyOn(component.loadDefaults, 'emit');
    component.onLoadDefaults();
    expect(component.loadDefaults.emit).toHaveBeenCalled();
  });
});
