import { TestBed } from '@angular/core/testing';
import { TipoEntrenamientoService } from './tipo-entrenamiento.service';
import { FIRESTORE } from '../firebase.tokens';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('TipoEntrenamientoService', () => {
  let service: TipoEntrenamientoService;

  const mockFirestore = {};
  const mockAuthService = {
    currentUser: signal<any>({ uid: 'test-user', gimnasioId: 'gym1' })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TipoEntrenamientoService,
        { provide: FIRESTORE, useValue: mockFirestore },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(TipoEntrenamientoService);
  });

  afterEach(() => {
      vi.clearAllMocks();
      mockAuthService.currentUser.set({ uid: 'test-user', gimnasioId: 'gym1' });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('guardarTipo', () => {
    it('should throw an error if the user is not authenticated', async () => {
      mockAuthService.currentUser.set(null);
      await expect(service.guardarTipo('Nuevo')).rejects.toThrow('Usuario no autenticado');
    });

    it('should throw an error if the type name already exists (duplicate)', async () => {
      (service as any)._tipos.set([{ id: '1', nombre: 'CrossFit', gimnasioId: 'gym1' }]);
      await expect(service.guardarTipo('CrossFit')).rejects.toThrow('Este tipo de entrenamiento ya existe');
    });

    it('should call save when creating a new valid type', async () => {
      (service as any)._tipos.set([{ id: '1', nombre: 'CrossFit', gimnasioId: 'gym1' }]);
      vi.spyOn(service, 'save').mockResolvedValue(undefined);
      
      await service.guardarTipo('Yoga');
      expect(service.save).toHaveBeenCalledWith(expect.objectContaining({ 
          nombre: 'Yoga', 
          gimnasioId: 'gym1', 
          creadoPor: 'test-user' 
      }));
    });

    it('should not throw if editing the same type with the same name', async () => {
      const mockTipo = { id: '1', nombre: 'CrossFit', gimnasioId: 'gym1' };
      (service as any)._tipos.set([mockTipo]);
      vi.spyOn(service, 'save').mockResolvedValue(undefined);

      await expect(service.guardarTipo('CrossFit', mockTipo)).resolves.not.toThrow();
      expect(service.save).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'CrossFit' }));
    });
  });
  
  describe('cargarPredeterminadosParaUsuarioActual', () => {
      it('should throw error if user is not authenticated', async () => {
          mockAuthService.currentUser.set(null);
          await expect(service.cargarPredeterminadosParaUsuarioActual()).rejects.toThrow('Usuario no autenticado');
      });
      
      it('should call loadDefaultTypes with correct gymId and userId', async () => {
          vi.spyOn(service, 'loadDefaultTypes').mockResolvedValue(undefined);
          await service.cargarPredeterminadosParaUsuarioActual();
          expect(service.loadDefaultTypes).toHaveBeenCalledWith('gym1', 'test-user');
      });
  });
});
