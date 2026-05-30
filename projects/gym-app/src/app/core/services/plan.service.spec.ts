/**
 * Tests para PlanService
 */
import { TestBed } from '@angular/core/testing';
import { PlanService } from './plan.service';
import { FIRESTORE } from '../firebase.tokens';
import { Plan } from 'gym-library';

const { mockAddDoc, mockGetDocs, mockOnSnapshot, mockCollection, mockQuery, mockWhere, mockOrderBy, mockLimit, mockTimestampNow } = vi.hoisted(() => ({
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id-123' })),
  mockGetDocs: vi.fn(),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockCollection: vi.fn(() => ({})),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockOrderBy: vi.fn(() => ({})),
  mockLimit: vi.fn(() => ({})),
  mockTimestampNow: vi.fn(() => ({ seconds: 1700000000, nanoseconds: 0, toDate: () => new Date() })),
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  onSnapshot: mockOnSnapshot,
  doc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: {
    now: mockTimestampNow,
    fromDate: vi.fn(d => d),
  },
}));

describe('PlanService', () => {
  let service: PlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlanService,
        { provide: FIRESTORE, useValue: {} },
      ],
    });
    service = TestBed.inject(PlanService);
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'new-doc-id-123' });
  });

  const mockUser = {
    uid: 'user-123',
    nombre: 'Juan Pérez',
    email: 'juan@test.com',
    plan: Plan.FREE,
    role: 'ENTRENADOR',
    onboarded: true,
  } as any;

  describe('solicitarPremium', () => {
    it('retorna el ID del documento creado', async () => {
      mockAddDoc.mockResolvedValue({ id: 'solicitud-456' });
      const id = await service.solicitarPremium(mockUser);
      expect(id).toBe('solicitud-456');
    });

    it('llama a addDoc con los datos correctos', async () => {
      mockAddDoc.mockResolvedValue({ id: 'solicitud-456' });
      await service.solicitarPremium(mockUser);
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'user-123',
          userName: 'Juan Pérez',
          userEmail: 'juan@test.com',
          planActual: Plan.FREE,
          planSolicitado: Plan.PREMIUM,
          estado: 'pendiente',
        })
      );
    });

    it('usa "Usuario" como nombre si el user no tiene nombre', async () => {
      await service.solicitarPremium({ ...mockUser, nombre: undefined });
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userName: 'Usuario' })
      );
    });

    it('usa string vacío como email si el user no tiene email', async () => {
      await service.solicitarPremium({ ...mockUser, email: undefined });
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userEmail: '' })
      );
    });

    it('usa Plan.FREE como planActual si el user no tiene plan', async () => {
      await service.solicitarPremium({ ...mockUser, plan: undefined });
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ planActual: Plan.FREE })
      );
    });

    it('siempre solicita Plan.PREMIUM', async () => {
      await service.solicitarPremium({ ...mockUser, plan: Plan.PREMIUM });
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ planSolicitado: Plan.PREMIUM })
      );
    });
  });

  describe('getUltimaSolicitud', () => {
    it('retorna null si no hay solicitudes', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      const result = await service.getUltimaSolicitud('user-123');
      expect(result).toBeNull();
    });

    it('retorna la solicitud con su ID', async () => {
      const fakeSolicitud = { userId: 'user-123', planSolicitado: Plan.PREMIUM, estado: 'pendiente' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'solicitud-789', data: () => fakeSolicitud }],
      });
      const result = await service.getUltimaSolicitud('user-123');
      expect(result?.id).toBe('solicitud-789');
    });

    it('filtra por userId', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      await service.getUltimaSolicitud('user-123');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
    });
  });

  describe('getSolicitudesUsuarioListener', () => {
    it('devuelve una función de unsubscribe', () => {
      const unsubscribeFn = vi.fn();
      mockOnSnapshot.mockReturnValue(unsubscribeFn);
      const unsubscribe = service.getSolicitudesUsuarioListener('user-123', vi.fn());
      expect(typeof unsubscribe).toBe('function');
    });

    it('llama al callback con array vacío si el snapshot está vacío', () => {
      let capturedCallbacks: any;
      mockOnSnapshot.mockImplementation((_q: any, cbs: any) => {
        capturedCallbacks = cbs;
        return vi.fn();
      });
      const callback = vi.fn();
      service.getSolicitudesUsuarioListener('user-123', callback);
      capturedCallbacks.next({ docs: [] });
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('llama al callback con solicitudes mapeadas', () => {
      let capturedCallbacks: any;
      mockOnSnapshot.mockImplementation((_q: any, cbs: any) => {
        capturedCallbacks = cbs;
        return vi.fn();
      });
      const callback = vi.fn();
      service.getSolicitudesUsuarioListener('user-123', callback);
      const fakeSolicitud = { userId: 'user-123', estado: 'pendiente' };
      capturedCallbacks.next({
        docs: [{ id: 'sol-1', data: () => fakeSolicitud }],
      });
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'sol-1', estado: 'pendiente' }),
        ])
      );
    });

    it('llama al callback con array vacío si hay error', () => {
      let capturedCallbacks: any;
      mockOnSnapshot.mockImplementation((_q: any, cbs: any) => {
        capturedCallbacks = cbs;
        return vi.fn();
      });
      const callback = vi.fn();
      service.getSolicitudesUsuarioListener('user-123', callback);
      capturedCallbacks.error(new Error('error'));
      expect(callback).toHaveBeenCalledWith([]);
    });
  });
});
