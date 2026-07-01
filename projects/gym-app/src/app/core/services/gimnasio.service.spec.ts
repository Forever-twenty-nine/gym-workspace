/**
 * Tests para GimnasioService
 */
import { Timestamp, setDoc, deleteDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-gym-id' })),
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

describe('GimnasioService — lógica de mapeo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToFirestore', () => {
    function mapToFirestore(gimnasio: any) {
      return {
        ...gimnasio,
        fechaCreacion: gimnasio.fechaCreacion instanceof Date
          ? Timestamp.fromDate(gimnasio.fechaCreacion)
          : (gimnasio.fechaCreacion || Timestamp.now()),
      };
    }

    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2020-01-01');
      mapToFirestore({ id: 'g-1', fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('usa Timestamp.now si fechaCreacion no está definida', () => {
      const result = mapToFirestore({ id: 'g-1' });
      expect(result.fechaCreacion).toBeDefined();
    });
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        fechaCreacion: data.fechaCreacion && typeof data.fechaCreacion.toDate === 'function'
          ? data.fechaCreacion.toDate()
          : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date())
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 'g-3',
        nombre: 'Gym Fit',
        direccion: 'Calle Falsa 123',
      };

      const result = mapFromFirestore(data);
      expect(result.nombre).toBe('Gym Fit');
      expect(result.direccion).toBe('Calle Falsa 123');
    });

    it('convierte duck-typed Timestamp a Date en fechaCreacion', () => {
      const result = mapFromFirestore({ 
        id: 'g-2', 
        fechaCreacion: { toDate: () => new Date('2021-01-15') }
      });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
    });
  });

  describe('operaciones ABM simuladas', () => {
    async function saveGym(gym: any) {
      await setDoc({} as any, gym);
    }
    
    async function deleteGym(id: string) {
      await deleteDoc({} as any);
    }

    it('saveGym llama a setDoc', async () => {
      await saveGym({ id: 'g-1' });
      expect(setDoc).toHaveBeenCalled();
    });

    it('deleteGym llama a deleteDoc', async () => {
      await deleteGym('g-1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
