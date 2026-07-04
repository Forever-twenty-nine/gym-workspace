import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditProfileModalComponent } from './edit-profile-modal.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { EntrenadorService } from '../../../../core/services/entrenador.service';
import { GimnasioService } from '../../../../core/services/gimnasio.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { FirebaseStorageService } from '../../../../core/services/firebase-storage.service';
import { Platform, LoadingController, ToastController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';

describe('EditProfileModalComponent', () => {
  let component: EditProfileModalComponent;
  let fixture: ComponentFixture<EditProfileModalComponent>;
  
  let mockUserService: any;
  let mockEntrenadoService: any;
  let mockEntrenadorService: any;
  let mockGimnasioService: any;
  
  let mockLoadingCtrl: any;
  let mockToastCtrl: any;
  let mockLoading: any;

  beforeEach(async () => {
    mockUserService = { updateUser: vi.fn().mockReturnValue(Promise.resolve()) };
    mockEntrenadoService = { save: vi.fn().mockReturnValue(Promise.resolve()) };
    mockEntrenadorService = { 
      update: vi.fn().mockReturnValue(Promise.resolve()),
      create: vi.fn().mockReturnValue(Promise.resolve()) 
    };
    mockGimnasioService = { save: vi.fn().mockReturnValue(Promise.resolve()) };
    
    mockLoading = { present: vi.fn(), dismiss: vi.fn() };
    mockLoadingCtrl = { create: vi.fn().mockReturnValue(Promise.resolve(mockLoading)) };
    mockToastCtrl = { create: vi.fn().mockReturnValue(Promise.resolve({ present: () => {} })) };

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ReactiveFormsModule, EditProfileModalComponent],
      providers: [
        FormBuilder,
        { provide: UserService, useValue: mockUserService },
        { provide: EntrenadoService, useValue: mockEntrenadoService },
        { provide: EntrenadorService, useValue: mockEntrenadorService },
        { provide: GimnasioService, useValue: mockGimnasioService },
        { provide: NotificacionService, useValue: {} },
        { provide: FirebaseStorageService, useValue: {} },
        { provide: LoadingController, useValue: mockLoadingCtrl },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: Platform, useValue: { is: () => false } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditProfileModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form for entrenado', () => {
    component.user = { uid: '1', email: 'e@e.com', nombre: 'Test', role: 'entrenado' };
    component.isOpen = true;
    component.ngOnChanges({ isOpen: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();
    
    expect(component.editForm.get('nombre')?.value).toBe('Test');
    expect(component.editForm.get('objetivo')).toBeTruthy();
  });

  it('should save profile for entrenado', async () => {
    component.user = { uid: '1', email: 'e@e.com', nombre: 'Test', role: 'entrenado' };
    component.entrenadoData = { id: '1', objetivo: 'Fuerza' };
    component.isOpen = true;
    component.ngOnInit();
    fixture.detectChanges();
    
    vi.spyOn(component.modalClosed, 'emit');
    component.editForm.patchValue({ nombre: 'Test Updated' });
    
    component.saveProfile();
    await new Promise(r => setTimeout(r, 0));

    expect(mockUserService.updateUser).toHaveBeenCalledWith('1', { nombre: 'Test Updated' });
    expect(mockEntrenadoService.save).toHaveBeenCalled();
    expect(component.modalClosed.emit).toHaveBeenCalled();
  });
});
