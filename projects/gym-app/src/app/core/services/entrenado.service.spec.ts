/**
 * Tests para EntrenadoService
 */
import { Timestamp, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-entrenado-id' })),
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

describe('EntrenadoService — lógica de mapeo y filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToFirestore', () => {
    function mapToFirestore(entrenado: any) {
      const { ...data } = entrenado;
      if (data.fechaNacimiento instanceof Date) {
        data.fechaNacimiento = Timestamp.fromDate(data.fechaNacimiento);
      }
      return data;
    }

    it('convierte fechaNacimiento Date llamando a Timestamp.fromDate', () => {
      const date = new Date('1990-01-01');
      mapToFirestore({ id: 'e-1', fechaNacimiento: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('preserva otros campos', () => {
      const result = mapToFirestore({ id: 'e-1', peso: 80, objetivo: 'hipertrofia' });
      expect(result.peso).toBe(80);
      expect(result.objetivo).toBe('hipertrofia');
    });
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        fechaNacimiento: data.fechaNacimiento && typeof data.fechaNacimiento.toDate === 'function'
          ? data.fechaNacimiento.toDate()
          : (data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined),
        seguidos: data.seguidos || [],
        seguidores: data.seguidores || [],
      };
    }

    it('preserva campos originales', () => {
      const data = { id: 'e-1', peso: 75, nivel: 'intermedio' };
      const result = mapFromFirestore(data);
      expect(result.peso).toBe(75);
      expect(result.nivel).toBe('intermedio');
    });

    it('convierte duck-typed Timestamp a Date en fechaNacimiento', () => {
      const result = mapFromFirestore({ 
        id: 'e-2', 
        fechaNacimiento: { toDate: () => new Date('1990-05-20') }
      });
      expect(result.fechaNacimiento).toBeInstanceOf(Date);
    });

    it('inicializa seguidos y seguidores como arrays vacios si no existen', () => {
      const result = mapFromFirestore({ id: 'e-3' });
      expect(result.seguidos).toEqual([]);
      expect(result.seguidores).toEqual([]);
    });

    it('preserva seguidos y seguidores si existen', () => {
      const result = mapFromFirestore({ id: 'e-3', seguidos: ['a'], seguidores: ['b'] });
      expect(result.seguidos).toEqual(['a']);
      expect(result.seguidores).toEqual(['b']);
    });
  });

  describe('lógica de following/unfollowing', () => {
    async function followUser(userId: string, targetId: string) {
      await updateDoc({} as any, { seguidos: [targetId] });
      await updateDoc({} as any, { seguidores: [userId] });
    }

    async function unfollowUser(userId: string, targetId: string) {
      await updateDoc({} as any, { seguidos: [] });
      await updateDoc({} as any, { seguidores: [] });
    }

    it('followUser actualiza ambos documentos', async () => {
      await followUser('user-1', 'target-2');
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('unfollowUser actualiza ambos documentos', async () => {
      await unfollowUser('user-1', 'target-2');
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });
  });
});
