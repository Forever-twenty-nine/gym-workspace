/**
 * Tests para EjercicioService
 */
import { Timestamp, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-ejercicio-id' })),
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

describe('EjercicioService — lógica de mapeo y filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeEjercicio', () => {
    function normalizeEjercicio(ejercicio: any) {
      return {
        ...ejercicio,
        nombre: ejercicio.nombre?.trim() || '',
        descripcion: ejercicio.descripcion?.trim() || '',
        musculosPrincipales: ejercicio.musculosPrincipales || [],
        musculosSecundarios: ejercicio.musculosSecundarios || [],
        equipamiento: ejercicio.equipamiento || [],
        variacionesIds: ejercicio.variacionesIds || [],
        tags: ejercicio.tags || [],
      };
    }

    it('limpia espacios en nombre y descripción', () => {
      const result = normalizeEjercicio({ nombre: '  Press Banca  ', descripcion: '  Con barra  ' });
      expect(result.nombre).toBe('Press Banca');
      expect(result.descripcion).toBe('Con barra');
    });

    it('inicializa arrays si son undefined', () => {
      const result = normalizeEjercicio({ nombre: 'Sentadilla' });
      expect(result.musculosPrincipales).toEqual([]);
      expect(result.musculosSecundarios).toEqual([]);
      expect(result.equipamiento).toEqual([]);
      expect(result.variacionesIds).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    it('preserva arrays existentes', () => {
      const result = normalizeEjercicio({ nombre: 'Curl', musculosPrincipales: ['Bíceps'] });
      expect(result.musculosPrincipales).toEqual(['Bíceps']);
    });
  });

  describe('validateEjercicio', () => {
    function validateEjercicio(ejercicio: any) {
      if (!ejercicio.nombre || ejercicio.nombre.trim() === '') {
        throw new Error('El nombre del ejercicio es requerido');
      }
    }

    it('lanza error si nombre es vacío', () => {
      expect(() => validateEjercicio({ nombre: '' })).toThrow('El nombre del ejercicio es requerido');
      expect(() => validateEjercicio({ nombre: '   ' })).toThrow('El nombre del ejercicio es requerido');
    });

    it('no lanza error si nombre tiene contenido', () => {
      expect(() => validateEjercicio({ nombre: 'Curl de Bíceps' })).not.toThrow();
    });
  });

  describe('mapToFirestore', () => {
    function mapToFirestore(ejercicio: any) {
      return {
        ...ejercicio,
        fechaCreacion: ejercicio.fechaCreacion instanceof Date
          ? Timestamp.fromDate(ejercicio.fechaCreacion)
          : (ejercicio.fechaCreacion || Timestamp.now()),
      };
    }

    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-03-10');
      mapToFirestore({ id: 'e-1', fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('usa Timestamp.now si fechaCreacion no está definida', () => {
      const result = mapToFirestore({ id: 'e-1' });
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
        id: 'e-3',
        nombre: 'Remo',
        musculosPrincipales: ['Espalda'],
        fechaCreacion: new Date('2024-01-01'),
      };

      const result = mapFromFirestore(data);
      expect(result.nombre).toBe('Remo');
      expect(result.musculosPrincipales).toEqual(['Espalda']);
    });

    it('convierte string de fecha a Date en fechaCreacion', () => {
      const result = mapFromFirestore({ id: 'e-2', fechaCreacion: '2024-01-15T00:00:00.000Z' });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
    });
  });

  describe('lógica de filtros', () => {
    function getByMuscle(ejercicios: any[], muscleId: string) {
      return ejercicios.filter(e =>
        e.musculosPrincipales?.includes(muscleId) ||
        e.musculosSecundarios?.includes(muscleId)
      );
    }

    function getByEquipment(ejercicios: any[], equipmentId: string) {
      return ejercicios.filter(e => e.equipamiento?.includes(equipmentId));
    }

    const allEjercicios = [
      { id: 'e-1', nombre: 'Press Banca', musculosPrincipales: ['pecho'], musculosSecundarios: ['triceps'], equipamiento: ['barra', 'banco'] },
      { id: 'e-2', nombre: 'Sentadilla', musculosPrincipales: ['cuadriceps'], musculosSecundarios: ['gluteos'], equipamiento: ['barra', 'rack'] },
      { id: 'e-3', nombre: 'Extensión Tríceps', musculosPrincipales: ['triceps'], equipamiento: ['polea'] },
    ];

    it('getByMuscle filtra por musculosPrincipales y secundarios', () => {
      const resultTriceps = getByMuscle(allEjercicios, 'triceps');
      expect(resultTriceps.length).toBe(2);
      expect(resultTriceps.map(e => e.id)).toEqual(expect.arrayContaining(['e-1', 'e-3']));

      const resultPecho = getByMuscle(allEjercicios, 'pecho');
      expect(resultPecho.length).toBe(1);
      expect(resultPecho[0].id).toBe('e-1');
    });

    it('getByEquipment filtra por equipamiento', () => {
      const resultBarra = getByEquipment(allEjercicios, 'barra');
      expect(resultBarra.length).toBe(2);
      expect(resultBarra.map(e => e.id)).toEqual(expect.arrayContaining(['e-1', 'e-2']));

      const resultRack = getByEquipment(allEjercicios, 'rack');
      expect(resultRack.length).toBe(1);
      expect(resultRack[0].id).toBe('e-2');
    });
  });
});
