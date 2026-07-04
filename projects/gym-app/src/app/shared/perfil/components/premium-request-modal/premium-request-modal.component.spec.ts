import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PremiumRequestModalComponent, User } from './premium-request-modal.component';
import { PlanService } from '../../../../core/services/plan.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';

describe('PremiumRequestModalComponent', () => {
  let component: PremiumRequestModalComponent;
  let fixture: ComponentFixture<PremiumRequestModalComponent>;
  let mockPlanService: any;
  let mockLoadingController: any;
  let mockToastController: any;
  let mockLoading: any;
  let mockToast: any;

  beforeEach(async () => {
    mockPlanService = { solicitarPremium: vi.fn().mockReturnValue(Promise.resolve()) };
    
    mockLoading = { present: vi.fn(), dismiss: vi.fn() };
    mockLoadingController = { create: vi.fn().mockReturnValue(Promise.resolve(mockLoading)) };
    
    mockToast = { present: vi.fn() };
    mockToastController = { create: vi.fn().mockReturnValue(Promise.resolve(mockToast)) };

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), PremiumRequestModalComponent],
      providers: [
        { provide: PlanService, useValue: mockPlanService },
        { provide: LoadingController, useValue: mockLoadingController },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumRequestModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal', () => {
    vi.spyOn(component.modalClosed, 'emit');
    component.close();
    expect(component.modalClosed.emit).toHaveBeenCalled();
  });

  it('should not request premium if user is null', async () => {
    component.user = null;
    component.confirmarSolicitud();
    await fixture.whenStable();
    expect(mockPlanService.solicitarPremium).not.toHaveBeenCalled();
  });

  it('should send premium request and close modal', async () => {
    component.user = { uid: 'u1', email: 'e@mail.com', nombre: 'Name', role: 'entrenado' };
    vi.spyOn(component, 'close');

    component.confirmarSolicitud();
    await new Promise(r => setTimeout(r, 0));

    expect(mockLoadingController.create).toHaveBeenCalled();
    expect(mockLoading.present).toHaveBeenCalled();
    expect(mockPlanService.solicitarPremium).toHaveBeenCalledWith(component.user);
    expect(mockToastController.create).toHaveBeenCalled();
    expect(mockToast.present).toHaveBeenCalled();
    expect(component.close).toHaveBeenCalled();
    expect(mockLoading.dismiss).toHaveBeenCalled();
  });
});
