import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiposEntrenamientoComponent } from './tipos-entrenamiento';
import { AuthService } from '../../../core/services/auth.service';
import { TipoEntrenamientoService } from '../../../core/services/tipo-entrenamiento.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';

describe('TiposEntrenamientoComponent', () => {
  let component: TiposEntrenamientoComponent;
  let fixture: ComponentFixture<TiposEntrenamientoComponent>;

  const mockAuthService = {
    currentUser: signal({ uid: 'test-user', gimnasioId: 'gym1' })
  };

  const mockTipoEntrenamientoService = {
    tipos: signal([]),
    initializeListener: vi.fn(),
    guardarTipo: vi.fn(),
    delete: vi.fn(),
    cargarPredeterminadosParaUsuarioActual: vi.fn()
  };

  const mockAlertCtrl = {
    create: vi.fn().mockResolvedValue({ present: vi.fn() })
  };

  const mockToastCtrl = {
    create: vi.fn().mockResolvedValue({ present: vi.fn() })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposEntrenamientoComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TipoEntrenamientoService, useValue: mockTipoEntrenamientoService },
        { provide: AlertController, useValue: mockAlertCtrl },
        { provide: ToastController, useValue: mockToastCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TiposEntrenamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
