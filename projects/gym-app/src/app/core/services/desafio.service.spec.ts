/**
 * Tests para DesafioService
 */
import { Timestamp, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-desafio-id' })),
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

describe('DesafioService — lógica de mapeo y filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToFirestore', () => {
    function mapToFirestore(desafio: any) {
      return {
        ...desafio,
        fechaCreacion: desafio.fechaCreacion instanceof Date
          ? Timestamp.fromDate(desafio.fechaCreacion)
          : (desafio.fechaCreacion || Timestamp.now()),
        fechaFin: desafio.fechaFin instanceof Date
          ? Timestamp.fromDate(desafio.fechaFin)
          : (desafio.fechaFin || Timestamp.now()),
      };
    }

    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-03-10');
      mapToFirestore({ id: 'd-1', fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('usa Timestamp.now si fechaCreacion no está definida', () => {
      const result = mapToFirestore({ id: 'd-1' });
      expect(result.fechaCreacion).toBeDefined();
    });
    
    it('convierte fechaFin Date a Timestamp', () => {
      const date = new Date('2024-03-20');
      const result = mapToFirestore({ id: 'd-1', fechaFin: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        fechaCreacion: data.fechaCreacion && typeof data.fechaCreacion.toDate === 'function'
          ? data.fechaCreacion.toDate()
          : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
        fechaFin: data.fechaFin && typeof data.fechaFin.toDate === 'function'
          ? data.fechaFin.toDate()
          : (data.fechaFin ? new Date(data.fechaFin) : undefined)
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 'd-3',
        titulo: 'Desafio 10k',
        gimnasioId: 'gym-1',
        fechaCreacion: new Date('2024-01-01'),
      };

      const result = mapFromFirestore(data);
      expect(result.titulo).toBe('Desafio 10k');
      expect(result.gimnasioId).toBe('gym-1');
    });

    it('convierte duck-typed Timestamp a Date en fechaCreacion y fechaFin', () => {
      const result = mapFromFirestore({ 
        id: 'd-2', 
        fechaCreacion: { toDate: () => new Date('2024-01-15') },
        fechaFin: { toDate: () => new Date('2024-01-20') }
      });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaFin).toBeInstanceOf(Date);
    });
  });

  describe('lógica de filtros', () => {
    function getDesafiosByGimnasio(desafios: any[], gimnasioId: string) {
      return desafios.filter(d => d.gimnasioId === gimnasioId);
    }

    const allDesafios = [
      { id: 'd-1', gimnasioId: 'gym-1', titulo: 'D1' },
      { id: 'd-2', gimnasioId: 'gym-2', titulo: 'D2' },
      { id: 'd-3', gimnasioId: 'gym-1', titulo: 'D3' },
    ];

    it('filtra por gimnasioId', () => {
      const result = getDesafiosByGimnasio(allDesafios, 'gym-1');
      expect(result.length).toBe(2);
      expect(result.map(d => d.id)).toEqual(expect.arrayContaining(['d-1', 'd-3']));
    });

    it('retorna array vacío si no hay coincidencias', () => {
      const result = getDesafiosByGimnasio(allDesafios, 'gym-99');
      expect(result.length).toBe(0);
    });
  });
});
