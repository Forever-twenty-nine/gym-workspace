import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatListModalComponent } from './chat-list-modal.component';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { ModalController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';
import { User, Mensaje, Rol, TipoMensaje } from 'gym-library';
import { BackgroundComponent } from '../../../components/background/background.component';

describe('ChatListModalComponent', () => {
  let component: ChatListModalComponent;
  let fixture: ComponentFixture<ChatListModalComponent>;
  let modalCtrlMock: any;
  let authServiceMock: any;
  let userServiceMock: any;
  let mensajeServiceMock: any;

  let currentUserSignal: any;
  let mensajesSignal: any;
  let getUserByUidSpy: any;

  beforeEach(async () => {
    currentUserSignal = signal<User | null>({ uid: 'u1', role: Rol.ENTRENADO } as User);
    mensajesSignal = signal<Mensaje[]>([]);
    getUserByUidSpy = vi.fn().mockImplementation((uid: string) => {
      return signal({ uid, nombre: 'User ' + uid } as User);
    });

    authServiceMock = { currentUser: currentUserSignal };
    userServiceMock = { getUserByUid: getUserByUidSpy };
    mensajeServiceMock = { mensajes: mensajesSignal };

    modalCtrlMock = {
      dismiss: vi.fn(),
      create: vi.fn().mockReturnValue({
        present: vi.fn().mockReturnValue(Promise.resolve())
      })
    };

    await TestBed.configureTestingModule({
      imports: [ChatListModalComponent, BackgroundComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: MensajeService, useValue: mensajeServiceMock },
        { provide: ModalController, useValue: modalCtrlMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should aggregate active chats correctly', () => {
    const msg1 = { id: '1', remitenteId: 'u1', destinatarioId: 'u2', fechaEnvio: new Date('2026-07-04T10:00:00Z'), leido: true } as Mensaje;
    const msg2 = { id: '2', remitenteId: 'u2', destinatarioId: 'u1', fechaEnvio: new Date('2026-07-04T10:05:00Z'), leido: false } as Mensaje;
    const msg3 = { id: '3', remitenteId: 'u3', destinatarioId: 'u1', fechaEnvio: new Date('2026-07-04T09:00:00Z'), leido: true } as Mensaje;

    mensajesSignal.set([msg1, msg2, msg3]);
    fixture.detectChanges();

    const chats = component.chatsActivos();
    expect(chats.length).toBe(2);
    // Sorts by newest first
    expect(chats[0].otherUserId).toBe('u2');
    expect(chats[0].unreadCount).toBe(1);
    expect(chats[0].lastMsg.id).toBe('2');

    expect(chats[1].otherUserId).toBe('u3');
    expect(chats[1].unreadCount).toBe(0);
  });

  it('should filter chats based on search query', () => {
    const msg1 = { id: '1', remitenteId: 'u1', destinatarioId: 'u2', fechaEnvio: new Date(), leido: true } as Mensaje;
    mensajesSignal.set([msg1]);
    fixture.detectChanges();

    expect(component.chatsFiltrados().length).toBe(1);

    component.onSearch({ detail: { value: 'User u2' } });
    fixture.detectChanges();
    expect(component.chatsFiltrados().length).toBe(1);

    component.onSearch({ detail: { value: 'Nonexistent' } });
    fixture.detectChanges();
    expect(component.chatsFiltrados().length).toBe(0);
  });

  it('should format time correctly', () => {
    const today = new Date();
    expect(component.formatTime(today)).toContain(':');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(component.formatTime(yesterday)).toBe('Ayer');

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    expect(component.formatTime(lastWeek)).toContain('/');
  });

  it('should open conversation modal', async () => {
    await component.abrirConversacion('u2');
    expect(modalCtrlMock.create).toHaveBeenCalled();
  });

  it('should close modal on cerrar()', () => {
    component.cerrar();
    expect(modalCtrlMock.dismiss).toHaveBeenCalled();
  });
});
