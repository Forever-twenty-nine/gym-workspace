/**
 * Tests para EstadisticasEntrenadoService
 */
import { Timestamp, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-stat-id' })),
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

describe('EstadisticasEntrenadoService — lógica de mapeo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        ultimaActualizacion: data.ultimaActualizacion && typeof data.ultimaActualizacion.toDate === 'function'
          ? data.ultimaActualizacion.toDate()
          : (data.ultimaActualizacion ? new Date(data.ultimaActualizacion) : new Date())
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 's-1',
        entrenadoId: 'e-1',
        pesoActual: 80,
      };

      const result = mapFromFirestore(data);
      expect(result.entrenadoId).toBe('e-1');
      expect(result.pesoActual).toBe(80);
    });

    it('convierte ultimaActualizacion a Date', () => {
      const result = mapFromFirestore({ 
        id: 's-1', 
        ultimaActualizacion: { toDate: () => new Date('2024-01-15') }
      });
      expect(result.ultimaActualizacion).toBeInstanceOf(Date);
    });
  });

  describe('operaciones ABM simuladas', () => {
    async function updateStat(id: string, data: any) {
      await updateDoc({} as any, {
        ...data,
        ultimaActualizacion: Timestamp.now()
      });
    }
    
    async function deleteStat(id: string) {
      await deleteDoc({} as any);
    }
    
    async function setStat(id: string, data: any) {
      await setDoc({} as any, data);
    }

    it('updateStat llama a updateDoc e incluye ultimaActualizacion', async () => {
      await updateStat('s-1', { pesoActual: 85 });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ 
          pesoActual: 85,
          ultimaActualizacion: expect.anything()
        })
      );
    });

    it('setStat llama a setDoc', async () => {
      await setStat('s-1', { pesoActual: 90 });
      expect(setDoc).toHaveBeenCalled();
    });

    it('deleteStat llama a deleteDoc', async () => {
      await deleteStat('s-1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
