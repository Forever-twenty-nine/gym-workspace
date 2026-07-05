import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { EntrenadosPage } from './entrenados.page';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { UserService } from '../../core/services/user.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { RutinaService } from '../../core/services/rutina.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { ToastController } from '@ionic/angular/standalone';
import { User, Rol, Plan, Entrenado, Rutina, RutinaAsignada, SesionRutina, SesionRutinaStatus } from 'gym-library';
import { vi } from 'vitest';

describe('EntrenadosPage', () => {
  let component: EntrenadosPage;
  let fixture: ComponentFixture<EntrenadosPage>;

  const mockUser: User = {
    uid: 'coach-1',
    nombre: 'Entrenador 1',
    role: Rol.ENTRENADOR,
    plan: Plan.PREMIUM,
    email: 'coach@test.com'
  };

  const mockClientUser: User = {
    uid: 'client-1',
    nombre: 'Client 1',
    role: Rol.ENTRENADO,
    plan: Plan.FREE,
    email: 'client1@test.com'
  };

  const mockEntrenado: Entrenado = {
    id: 'client-1',
    entrenadoresId: ['coach-1'],
    rutinasAsignadasIds: ['rut-1'],
    photoSocialURL: 'photo.jpg',
    objetivo: 'Ganar masa muscular'
  };

  const mockRutina: Rutina = {
    id: 'rut-1',
    nombre: 'Rutina Fuerza',
    creadorId: 'coach-1'
  };

  const mockRutinaAsignada: RutinaAsignada = {
    id: 'asig-1',
    rutinaId: 'rut-1',
    entrenadoId: 'client-1',
    entrenadorId: 'coach-1',
    diaSemana: 'Lunes',
    activa: true
  };

  const mockSesion: SesionRutina = {
    id: 'sesion-1',
    entrenadoId: 'client-1',
    status: SesionRutinaStatus.EN_PROGRESO,
    duracion: 3600
  };

  let mockAuthService: any;
  let mockEntrenadoService: any;
  let mockEntrenadorService: any;
  let mockUserService: any;
  let mockNotificacionService: any;
  let mockRutinaService: any;
  let mockInvitacionService: any;
  let mockRutinaAsignadaService: any;
  let mockSesionRutinaService: any;
  let mockToast: any;
  let mockToastController: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: signal(mockUser)
    };

    mockEntrenadoService = {
      entrenados: signal([mockEntrenado]),
      initializeListener: vi.fn(),
      save: vi.fn().mockResolvedValue({})
    };

    mockEntrenadorService = {
      initializeListener: vi.fn(),
      getLimits: vi.fn().mockReturnValue({ maxClients: 5 }),
      desvincularEntrenado: vi.fn().mockResolvedValue({})
    };

    mockUserService = {
      users: signal([mockUser, mockClientUser]),
      getUserByUid: vi.fn().mockReturnValue(signal(mockUser)),
      getUserByEmailAsync: vi.fn().mockResolvedValue(mockClientUser)
    };

    mockNotificacionService = {
      initializeListener: vi.fn()
    };

    mockRutinaService = {
      rutinas: signal([mockRutina])
    };

    mockInvitacionService = {
      getInvitacionesPendientesPorEntrenador: vi.fn().mockReturnValue(signal([])),
      crearInvitacion: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    };

    mockRutinaAsignadaService = {
      getRutinasAsignadasByEntrenado: vi.fn().mockReturnValue(signal([mockRutinaAsignada])),
      save: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    };

    mockSesionRutinaService = {
      getSesionesPorEntrenado: vi.fn().mockReturnValue(signal([mockSesion]))
    };

    mockToast = {
      present: vi.fn().mockResolvedValue({})
    };
    mockToastController = {
      create: vi.fn().mockResolvedValue(mockToast)
    };

    await TestBed.configureTestingModule({
      imports: [EntrenadosPage],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: EntrenadoService, useValue: mockEntrenadoService },
        { provide: EntrenadorService, useValue: mockEntrenadorService },
        { provide: UserService, useValue: mockUserService },
        { provide: NotificacionService, useValue: mockNotificacionService },
        { provide: RutinaService, useValue: mockRutinaService },
        { provide: InvitacionService, useValue: mockInvitacionService },
        { provide: RutinaAsignadaService, useValue: mockRutinaAsignadaService },
        { provide: SesionRutinaService, useValue: mockSesionRutinaService },
        { provide: ToastController, useValue: mockToastController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntrenadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should build the correct viewmodels for clients', () => {
    const vmList = component.entrenadosViewModel();
    expect(vmList.length).toBe(1);
    expect(vmList[0].id).toBe('client-1');
    expect(vmList[0].nombre).toBe('Client 1');
    expect(vmList[0].photoURL).toBe('photo.jpg');
    expect(vmList[0].objetivo).toBe('Ganar masa muscular');
    expect(vmList[0].estaEntrenando).toBe(true);
  });

  it('should compute help text', () => {
    expect(component.helpText()).toContain('Clientes activos: 1/5');
  });

  it('should format time correctly', () => {
    expect(component.formatearTiempo(7200)).toBe('2h 0m');
    expect(component.formatearTiempo(300)).toBe('5 min');
    expect(component.formatearTiempo(0)).toBe('0 min');
  });

  it('should check if client is training', () => {
    expect(component.estaEntrenando('client-1')).toBe(true);
  });

  describe('onFabCreate', () => {
    it('should open invitation modal if limit is not reached', async () => {
      mockEntrenadorService.getLimits.mockReturnValue({ maxClients: 5 });
      fixture.detectChanges();
      
      component.onFabCreate();
      expect(component.isInvitacionModalOpen()).toBe(true);
    });

    it('should show a warning toast if client limit is reached', async () => {
      mockEntrenadorService.getLimits.mockReturnValue({ maxClients: 1 });
      fixture.detectChanges();

      await component.onFabCreate();
      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Límite de entrenados alcanzado para tu plan.',
        color: 'warning'
      }));
      expect(mockToast.present).toHaveBeenCalled();
    });
  });

  describe('saveInvitacion', () => {
    it('should show toast if email form is invalid', async () => {
      component.openInvitacionModal();
      component.invitacionForm().setValue({ email: 'invalid-email', mensaje: '' });
      await component.saveInvitacion();

      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Por favor, completa todos los campos obligatorios',
        color: 'warning'
      }));
      expect(mockToast.present).toHaveBeenCalled();
    });

    it('should show toast if email is not registered', async () => {
      mockUserService.getUserByEmailAsync.mockResolvedValue(null);
      component.openInvitacionModal();
      component.invitacionForm().setValue({ email: 'notfound@test.com', mensaje: '' });
      await component.saveInvitacion();

      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('No se encontró un usuario con ese email'),
        color: 'danger'
      }));
    });

    it('should create invitation and show success toast if form is valid', async () => {
      component.openInvitacionModal();
      component.invitacionForm().setValue({ email: 'client1@test.com', mensaje: 'Hola' });
      await component.saveInvitacion();

      expect(mockInvitacionService.crearInvitacion).toHaveBeenCalledWith(
        'coach-1',
        'client-1',
        'Entrenador 1',
        'Client 1',
        'client1@test.com',
        'Hola'
      );
      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invitación enviada exitosamente',
        color: 'success'
      }));
    });
  });

  describe('cancelarInvitacion', () => {
    it('should call delete on invitation service and show success toast', async () => {
      await component.cancelarInvitacion('inv-1');
      expect(mockInvitacionService.delete).toHaveBeenCalledWith('inv-1');
      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invitación cancelada correctamente',
        color: 'success'
      }));
    });
  });

  describe('asignarRutina', () => {
    it('should save the modified entrenado and assign daily routines', async () => {
      component.verCliente(mockEntrenado);
      const newRutina: Rutina = { id: 'rut-2', nombre: 'Nueva Rutina', creadorId: 'coach-1' };
      await component.asignarRutina(newRutina);

      expect(mockEntrenadoService.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'client-1',
        rutinasAsignadasIds: ['rut-1', 'rut-2']
      }));
    });
  });

  describe('desasignarRutina', () => {
    it('should remove daily assignments and update entrenado routine list', async () => {
      component.verCliente(mockEntrenado);
      await component.desasignarRutina(mockRutina);

      expect(mockRutinaAsignadaService.delete).toHaveBeenCalledWith('asig-1');
      expect(mockEntrenadoService.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'client-1',
        rutinasAsignadasIds: []
      }));
    });
  });

  describe('desasociarEntrenado', () => {
    it('should call desvincularEntrenado and show toast', async () => {
      await component.desasociarEntrenado(mockEntrenado);
      expect(mockEntrenadorService.desvincularEntrenado).toHaveBeenCalledWith('coach-1', 'client-1');
      expect(mockToastController.create).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Entrenado desasociado y rutinas limpiadas con éxito',
        color: 'warning'
      }));
    });
  });
});
