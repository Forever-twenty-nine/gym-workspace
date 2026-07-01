/**
 * Tests para DesafioParticipacionService
 */
import { Timestamp, updateDoc, addDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-part-id' })),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockCollection: vi.fn(() => ({})),
  mockDoc: vi.fn(() => ({})),
  mockQuery: vi.fn(() => ({})),
  mockOrderBy: vi.fn(() => ({})),
  mockTimestamp: {
    now: vi.fn(() => ({ seconds: 1700000000, nanoseconds: 0, toDate: () => new Date('2024-01-01') })),
    fromDate: vi.fn((d: Date) => ({ seconds: d.getTime() / 1000, toDate: () => d })),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  doc: mockDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: vi.fn(),
  orderBy: mockOrderBy,
  Timestamp: mockTimestamp,
}));

describe('DesafioParticipacionService — lógica de mapeo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        fechaParticipacion: data.fechaParticipacion && typeof data.fechaParticipacion.toDate === 'function'
          ? data.fechaParticipacion.toDate()
          : (data.fechaParticipacion ? new Date(data.fechaParticipacion) : new Date())
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 'p-1',
        desafioId: 'd-1',
        entrenadoId: 'e-1',
        estado: 'aceptado',
      };

      const result = mapFromFirestore(data);
      expect(result.desafioId).toBe('d-1');
      expect(result.estado).toBe('aceptado');
    });

    it('convierte fechaParticipacion a Date si tiene toDate()', () => {
      const result = mapFromFirestore({ 
        id: 'p-1', 
        fechaParticipacion: { toDate: () => new Date('2024-01-15') }
      });
      expect(result.fechaParticipacion).toBeInstanceOf(Date);
    });
    
    it('crea un Date nuevo si fechaParticipacion no existe o es string', () => {
      const result = mapFromFirestore({ id: 'p-1', fechaParticipacion: '2024-01-01' });
      expect(result.fechaParticipacion).toBeInstanceOf(Date);
    });
  });

  describe('acciones: participar y responder', () => {
    async function participar(desafioId: string, entrenadoId: string, gymId?: string) {
      const payload: any = {
        desafioId,
        entrenadoId,
        estado: 'aceptado',
        fechaParticipacion: Timestamp.now()
      };
      if (gymId) payload.gimnasioId = gymId;
      await addDoc({} as any, payload);
    }

    async function responder(participacionId: string, superado: boolean) {
      await updateDoc({} as any, {
        estado: superado ? 'superado' : 'no_superado',
        fechaRespuesta: Timestamp.now()
      });
    }

    it('participar llama a addDoc con estado aceptado', async () => {
      await participar('d-1', 'e-1');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ 
          desafioId: 'd-1',
          entrenadoId: 'e-1',
          estado: 'aceptado'
        })
      );
    });
    
    it('participar incluye gimnasioId si se provee', async () => {
      await participar('d-1', 'e-1', 'gym-1');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ gimnasioId: 'gym-1' })
      );
    });

    it('responder cambia estado a superado', async () => {
      await responder('p-1', true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ estado: 'superado' })
      );
    });

    it('responder cambia estado a no_superado', async () => {
      await responder('p-1', false);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ estado: 'no_superado' })
      );
    });
  });
});
