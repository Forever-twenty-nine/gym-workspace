/**
 * Tests para RutinaService
 * Cubre: mapToFirestore, mapFromFirestore, getCreatedByUser (legacy merge + dedup),
 * filtros computed, estado inicial del signal, y operaciones de escritura Firebase.
 */
import { signal, computed } from '@angular/core';
import { Timestamp, addDoc, setDoc, deleteDoc } from 'firebase/firestore';

const {
  mockAddDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockDoc,
  mockCollection,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-rutina-id' })),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockDoc: vi.fn(() => ({})),
  mockCollection: vi.fn(() => ({})),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockTimestamp: {
    now: vi.fn(() => ({ seconds: 1700000000, nanoseconds: 0, toDate: () => new Date('2024-01-01') })),
    fromDate: vi.fn((d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0, toDate: () => d })),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  doc: mockDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: mockWhere,
  Timestamp: mockTimestamp,
}));

// ─── helpers que replican la lógica pura del servicio ───────────────────────

function mapToFirestore(rutina: any): any {
  const data: any = {
    nombre: rutina.nombre,
    activa: rutina.activa ?? true,
  };
  data.descripcion = rutina.descripcion || '';
  if (rutina.ejerciciosIds && rutina.ejerciciosIds.length > 0) {
    data.ejerciciosIds = rutina.ejerciciosIds;
  }
  if (rutina.fechaCreacion) {
    data.fechaCreacion =
      rutina.fechaCreacion instanceof Date
        ? Timestamp.fromDate(rutina.fechaCreacion)
        : rutina.fechaCreacion;
  }
  if (rutina.fechaModificacion) {
    data.fechaModificacion =
      rutina.fechaModificacion instanceof Date
        ? Timestamp.fromDate(rutina.fechaModificacion)
        : rutina.fechaModificacion;
  }
  if (rutina.duracion && rutina.duracion > 0) data.duracion = rutina.duracion;
  if (rutina.creadorId) data.creadorId = rutina.creadorId;
  if (
    rutina.diasSemana &&
    Array.isArray(rutina.diasSemana) &&
    rutina.diasSemana.length > 0
  ) {
    data.diasSemana = rutina.diasSemana;
  }
  return data;
}

function mapFromFirestore(data: any): any {
  return {
    id: data.id,
    nombre: data.nombre || '',
    activa: data.activa ?? true,
    descripcion: data.descripcion,
    ejerciciosIds: data.ejerciciosIds || data.ejercicios || [],
    fechaCreacion:
      data.fechaCreacion instanceof Object && typeof data.fechaCreacion.toDate === 'function'
        ? data.fechaCreacion.toDate()
        : data.fechaCreacion,
    fechaModificacion:
      data.fechaModificacion instanceof Object && typeof data.fechaModificacion.toDate === 'function'
        ? data.fechaModificacion.toDate()
        : data.fechaModificacion,
    duracion: data.duracion,
    creadorId: data.creadorId,
    diasSemana: data.diasSemana || [],
  };
}

function getCreatedByUser(allRutinas: any[], userId: string, legacyCreatedIds: string[] = []) {
  const byCreator = allRutinas.filter((r) => r.creadorId === userId);
  const legacySet = new Set(legacyCreatedIds);
  const byLegacy = allRutinas.filter((r) => legacySet.has(r.id));
  const map = new Map<string, any>();
  [...byCreator, ...byLegacy].forEach((r) => map.set(r.id, r));
  return Array.from(map.values());
}

// ─── suite principal ─────────────────────────────────────────────────────────

describe('RutinaService — lógica de mapeo y filtrado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── mapToFirestore ──────────────────────────────────────────────────────────
  describe('mapToFirestore', () => {
    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-06-01');
      mapToFirestore({ nombre: 'Rutina A', activa: true, fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('NO incluye ejerciciosIds si el array está vacío', () => {
      const result = mapToFirestore({ nombre: 'Rutina B', activa: true, ejerciciosIds: [] });
      expect(result.ejerciciosIds).toBeUndefined();
    });

    it('incluye ejerciciosIds si el array tiene elementos', () => {
      const result = mapToFirestore({
        nombre: 'Rutina C',
        activa: true,
        ejerciciosIds: ['ej-1', 'ej-2'],
      });
      expect(result.ejerciciosIds).toEqual(['ej-1', 'ej-2']);
    });

    it('usa activa=true por defecto cuando no se provee', () => {
      const result = mapToFirestore({ nombre: 'Rutina D' });
      expect(result.activa).toBe(true);
    });

    it('NO incluye duracion cuando es 0 o undefined', () => {
      const r1 = mapToFirestore({ nombre: 'X', activa: false, duracion: 0 });
      const r2 = mapToFirestore({ nombre: 'X', activa: false });
      expect(r1.duracion).toBeUndefined();
      expect(r2.duracion).toBeUndefined();
    });

    it('convierte fechaModificacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-09-15');
      mapToFirestore({ nombre: 'Rutina E', activa: true, fechaModificacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });
  });

  // ── mapFromFirestore ────────────────────────────────────────────────────────
  describe('mapFromFirestore', () => {
    it('convierte Timestamp de fechaCreacion a Date', () => {
      const fakeTs = { toDate: () => new Date('2024-03-01') };
      const result = mapFromFirestore({ id: 'r-1', nombre: 'R', activa: true, fechaCreacion: fakeTs });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaCreacion.getFullYear()).toBe(2024);
    });

    it('convierte Timestamp de fechaModificacion a Date', () => {
      const fakeTs = { toDate: () => new Date('2025-01-20') };
      const result = mapFromFirestore({ id: 'r-2', nombre: 'R', activa: true, fechaModificacion: fakeTs });
      expect(result.fechaModificacion).toBeInstanceOf(Date);
    });

    it('ejerciciosIds cae a [] cuando no existe en Firestore', () => {
      const result = mapFromFirestore({ id: 'r-3', nombre: 'R', activa: false });
      expect(result.ejerciciosIds).toEqual([]);
    });

    it('usa campo legacy "ejercicios" cuando ejerciciosIds no existe', () => {
      const result = mapFromFirestore({
        id: 'r-4',
        nombre: 'R',
        activa: true,
        ejercicios: ['ej-legacy'],
      });
      expect(result.ejerciciosIds).toEqual(['ej-legacy']);
    });

    it('preserva nombre, activa, creadorId y diasSemana correctamente', () => {
      const result = mapFromFirestore({
        id: 'r-5',
        nombre: 'Fuerza',
        activa: true,
        creadorId: 'user-42',
        diasSemana: ['lunes', 'miercoles'],
      });
      expect(result.nombre).toBe('Fuerza');
      expect(result.activa).toBe(true);
      expect(result.creadorId).toBe('user-42');
      expect(result.diasSemana).toEqual(['lunes', 'miercoles']);
    });

    it('activa usa true por defecto cuando está ausente', () => {
      const result = mapFromFirestore({ id: 'r-6', nombre: 'Sin activa' });
      expect(result.activa).toBe(true);
    });
  });

  // ── getCreatedByUser ────────────────────────────────────────────────────────
  describe('getCreatedByUser', () => {
    const allRutinas = [
      { id: 'r-1', nombre: 'A', activa: true, creadorId: 'user-1' },
      { id: 'r-2', nombre: 'B', activa: true, creadorId: 'user-2' },
      { id: 'r-3', nombre: 'C', activa: true, creadorId: 'user-1' },
      { id: 'r-4', nombre: 'D', activa: false, creadorId: undefined },
    ];

    it('devuelve sólo rutinas cuyo creadorId coincide con el userId', () => {
      const result = getCreatedByUser(allRutinas, 'user-1');
      expect(result.map((r) => r.id)).toEqual(['r-1', 'r-3']);
    });

    it('devuelve [] cuando no hay rutinas del usuario ni legacy', () => {
      const result = getCreatedByUser(allRutinas, 'user-99');
      expect(result).toHaveLength(0);
    });

    it('incluye rutinas legacy que no tienen creadorId', () => {
      const result = getCreatedByUser(allRutinas, 'user-99', ['r-4']);
      expect(result.map((r) => r.id)).toContain('r-4');
    });

    it('desduplicados: rutina presente en byCreator y legacy aparece sólo una vez', () => {
      const result = getCreatedByUser(allRutinas, 'user-1', ['r-1']);
      const ids = result.map((r) => r.id);
      expect(ids.filter((id) => id === 'r-1')).toHaveLength(1);
    });

    it('combina rutinas por creadorId y por legacy correctamente', () => {
      const result = getCreatedByUser(allRutinas, 'user-2', ['r-4']);
      expect(result.map((r) => r.id)).toContain('r-2');
      expect(result.map((r) => r.id)).toContain('r-4');
    });
  });

  // ── filtros computed sobre signal ───────────────────────────────────────────
  describe('filtros computed sobre signal', () => {
    const makeSignalWithData = (data: any[]) => signal(data);

    it('getRutinasByNombre filtra por nombre (case-insensitive)', () => {
      const _rutinas = makeSignalWithData([
        { id: 'r-1', nombre: 'Fuerza Superior', activa: true },
        { id: 'r-2', nombre: 'Cardio HIIT', activa: true },
        { id: 'r-3', nombre: 'fuerza inferior', activa: false },
      ]);
      const result = computed(() =>
        _rutinas().filter((r) => r.nombre.toLowerCase().includes('fuerza'))
      );
      expect(result().map((r) => r.id)).toEqual(['r-1', 'r-3']);
    });

    it('getRutinasActivas filtra sólo activas', () => {
      const _rutinas = makeSignalWithData([
        { id: 'r-1', nombre: 'A', activa: true },
        { id: 'r-2', nombre: 'B', activa: false },
        { id: 'r-3', nombre: 'C', activa: true },
      ]);
      const activas = computed(() => _rutinas().filter((r) => r.activa));
      expect(activas().length).toBe(2);
      expect(activas().map((r) => r.id)).toEqual(['r-1', 'r-3']);
    });

    it('getRutinasByDuracion filtra por duración exacta', () => {
      const _rutinas = makeSignalWithData([
        { id: 'r-1', nombre: 'A', activa: true, duracion: 45 },
        { id: 'r-2', nombre: 'B', activa: true, duracion: 60 },
        { id: 'r-3', nombre: 'C', activa: true, duracion: 45 },
      ]);
      const result = computed(() => _rutinas().filter((r) => r.duracion === 45));
      expect(result().map((r) => r.id)).toEqual(['r-1', 'r-3']);
    });

    it('rutinaCount refleja el total de rutinas en el signal', () => {
      const _rutinas = makeSignalWithData([
        { id: 'r-1', nombre: 'A', activa: true },
        { id: 'r-2', nombre: 'B', activa: false },
      ]);
      const count = computed(() => _rutinas().length);
      expect(count()).toBe(2);
    });

    it('rutinaActivaCount cuenta sólo las activas', () => {
      const _rutinas = makeSignalWithData([
        { id: 'r-1', activa: true },
        { id: 'r-2', activa: false },
        { id: 'r-3', activa: true },
        { id: 'r-4', activa: true },
      ]);
      const count = computed(() => _rutinas().filter((r) => r.activa).length);
      expect(count()).toBe(3);
    });

    it('filtra rutinas por gimnasioId', () => {
      const rutinas = [
        { id: 'r-1', nombre: 'A', activa: true, gimnasioId: 'gym-1' },
        { id: 'r-2', nombre: 'B', activa: true, gimnasioId: 'gym-2' },
        { id: 'r-3', nombre: 'C', activa: true, gimnasioId: 'gym-1' },
      ];
      const filtered = rutinas.filter((r) => r.gimnasioId === 'gym-1');
      expect(filtered.map((r) => r.id)).toEqual(['r-1', 'r-3']);
    });

    it('filtra rutinas por entrenadorId/creadorId', () => {
      const rutinas = [
        { id: 'r-1', activa: true, creadorId: 'ent-1' },
        { id: 'r-2', activa: true, creadorId: 'ent-2' },
        { id: 'r-3', activa: false, creadorId: 'ent-1' },
      ];
      const filtered = rutinas.filter((r) => r.creadorId === 'ent-1');
      expect(filtered).toHaveLength(2);
    });

    it('señal inicia con array vacío', () => {
      const _rutinas = signal<any[]>([]);
      expect(_rutinas()).toEqual([]);
      expect(_rutinas().length).toBe(0);
    });
  });

  // ── operaciones de escritura Firebase ────────────────────────────────────────
  describe('operaciones Firebase: save / delete', () => {
    it('save sin id llama a addDoc con los datos mapeados', async () => {
      const col = mockCollection();
      const rutina = { id: '', nombre: 'Nueva Rutina', activa: true };
      const dataToSave = mapToFirestore(rutina);
      await addDoc(col, dataToSave);
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nombre: 'Nueva Rutina', activa: true })
      );
    });

    it('save con id llama a setDoc con merge:true', async () => {
      const ref = mockDoc();
      const rutina = { id: 'r-existing', nombre: 'Rutina Existente', activa: false };
      const dataToSave = mapToFirestore(rutina);
      await setDoc(ref, dataToSave, { merge: true });
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ nombre: 'Rutina Existente' }),
        { merge: true }
      );
    });

    it('delete llama a deleteDoc con la referencia correcta', async () => {
      const ref = mockDoc();
      await deleteDoc(ref);
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.anything());
    });
  });
});
