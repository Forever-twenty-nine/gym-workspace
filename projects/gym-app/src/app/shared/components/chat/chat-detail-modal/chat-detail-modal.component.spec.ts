import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatDetailModalComponent } from './chat-detail-modal.component';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { ModalController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';
import { User, Mensaje, Rol, TipoMensaje } from 'gym-library';
import { BackgroundComponent } from '../../background/background.component';

describe('ChatDetailModalComponent', () => {
  let component: ChatDetailModalComponent;
  let fixture: ComponentFixture<ChatDetailModalComponent>;
  let modalCtrlMock: any;
  let authServiceMock: any;
  let userServiceMock: any;
  let mensajeServiceMock: any;
  
  let currentUserSignal: any;
  let mensajesSignal: any;
  let getUserByUidSignal: any;

  beforeEach(async () => {
    currentUserSignal = signal<User | null>({ uid: 'user1', role: Rol.ENTRENADO } as User);
    mensajesSignal = signal<Mensaje[]>([]);
    getUserByUidSignal = signal<User | null>({ uid: 'user2', nombre: 'Test Partner' } as User);

    authServiceMock = { currentUser: currentUserSignal };
    
    userServiceMock = { 
      getUserByUid: vi.fn().mockReturnValue(getUserByUidSignal)
    };
    
    mensajeServiceMock = {
      mensajes: mensajesSignal,
      marcarComoLeido: vi.fn().mockReturnValue(Promise.resolve()),
      save: vi.fn().mockReturnValue(Promise.resolve())
    };

    modalCtrlMock = {
      dismiss: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ChatDetailModalComponent, BackgroundComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: MensajeService, useValue: mensajeServiceMock },
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatDetailModalComponent);
    component = fixture.componentInstance;
    
    // Set input
    fixture.componentRef.setInput('otherUserId', 'user2');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize partner info correctly', () => {
    expect(component.partnerName()).toBe('Test Partner');
    expect(component.partnerPhoto()).toBeNull();
  });

  it('should filter and sort messages', () => {
    const msg1 = { id: '1', remitenteId: 'user1', destinatarioId: 'user2', fechaEnvio: new Date('2026-07-04T10:00:00Z'), leido: false } as Mensaje;
    const msg2 = { id: '2', remitenteId: 'user2', destinatarioId: 'user1', fechaEnvio: new Date('2026-07-04T10:05:00Z'), leido: false } as Mensaje;
    const msgOther = { id: '3', remitenteId: 'user3', destinatarioId: 'user1', fechaEnvio: new Date('2026-07-04T10:10:00Z'), leido: false } as Mensaje;
    
    mensajesSignal.set([msg2, msgOther, msg1]);
    fixture.detectChanges();
    
    expect(component.mensajesFiltrados().length).toBe(2);
    expect(component.mensajesFiltrados()[0].id).toBe('1');
    expect(component.mensajesFiltrados()[1].id).toBe('2');
  });

  it('should mark unread messages as read', () => {
    const msg = { id: '2', remitenteId: 'user2', destinatarioId: 'user1', fechaEnvio: new Date(), leido: false } as Mensaje;
    mensajesSignal.set([msg]);
    fixture.detectChanges();
    
    expect(mensajeServiceMock.marcarComoLeido).toHaveBeenCalledWith('2');
  });

  it('should close modal on cerrar()', () => {
    component.cerrar();
    expect(modalCtrlMock.dismiss).toHaveBeenCalled();
  });

  it('should send a new message', async () => {
    component.nuevoMensaje.set('Hello world!');
    await component.enviarMensaje();
    
    expect(mensajeServiceMock.save).toHaveBeenCalled();
    expect(component.nuevoMensaje()).toBe('');
  });
  
  it('should format time correctly', () => {
    const date = new Date('2026-07-04T15:30:00');
    // Depending on timezone, could be different but usually returns something like "15:30" or "03:30 PM"
    expect(component.formatTime(date)).toContain(':');
    expect(component.formatTime(undefined)).toBe('');
  });
});
