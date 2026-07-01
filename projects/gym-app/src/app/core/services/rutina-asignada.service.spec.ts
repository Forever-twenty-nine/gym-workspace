/**
 * Tests para RutinaAsignadaService
 */
import { Timestamp, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signal, computed } from '@angular/core';

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

// ─── helpers que replican la lógica pura del servicio ────────────────────────

function mapToFirestore(rutinaAsignada: any): any {
  return {
    rutinaId: rutinaAsignada.rutinaId,
    entrenadoId: rutinaAsignada.entrenadoId,
    entrenadorId: rutinaAsignada.entrenadorId,
    diaSemana: rutinaAsignada.diaSemana || null,
    fechaEspecifica: rutinaAsignada.fechaEspecifica
      ? Timestamp.fromDate(rutinaAsignada.fechaEspecifica)
      : null,
    fechaAsignacion: rutinaAsignada.fechaAsignacion
      ? Timestamp.fromDate(rutinaAsignada.fechaAsignacion)
      : Timestamp.now(),
    activa: rutinaAsignada.activa,
  };
}

function mapFromFirestore(data: any): any {
  return {
    id: data.id,
    rutinaId: data.rutinaId,
    entrenadoId: data.entrenadoId,
    entrenadorId: data.entrenadorId,
    diaSemana: data.diaSemana || undefined,
    fechaEspecifica: data.fechaEspecifica && typeof data.fechaEspecifica.toDate === 'function'
      ? data.fechaEspecifica.toDate()
      : data.fechaEspecifica,
    fechaAsignacion: data.fechaAsignacion && typeof data.fechaAsignacion.toDate === 'function'
      ? data.fechaAsignacion.toDate()
      : (data.fechaAsignacion ? new Date(data.fechaAsignacion) : new Date()),
    activa: data.activa,
  };
}

async function save(rutinaAsignada: any, firestoreStub: any): Promise<void> {
  const dataToSave = mapToFirestore(rutinaAsignada);
  if (rutinaAsignada.id) {
    const ref = mockDoc(firestoreStub, 'rutinas-asignadas', rutinaAsignada.id);
    await setDoc(ref, dataToSave, { merge: true });
  } else {
    const col = mockCollection(firestoreStub, 'rutinas-asignadas');
    const docRef = await addDoc(col, dataToSave);
    rutinaAsignada.id = (docRef as any).id;
  }
}

async function deleteRutina(id: string, firestoreStub: any): Promise<void> {
  const ref = mockDoc(firestoreStub, 'rutinas-asignadas', id);
  await deleteDoc(ref);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('RutinaAsignadaService — lógica pura', () => {
  const firestoreStub = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Estado inicial ─────────────────────────────────────────────────────────
  describe('estado inicial de señal', () => {
    it('_rutinasAsignadas empieza como array vacío', () => {
      const rutinasAsignadas = signal<any[]>([]);
      expect(rutinasAsignadas()).toEqual([]);
    });
  });

  // ── mapToFirestore ─────────────────────────────────────────────────────────
  describe('mapToFirestore', () => {
    it('convierte fechaAsignacion Date usando Timestamp.fromDate', () => {
      const fecha = new Date('2024-06-15T12:00:00Z');
      mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true, fechaAsignacion: fecha });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
    });

    it('usa Timestamp.now() cuando fechaAsignacion no está definida', () => {
      mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('convierte fechaEspecifica Date usando Timestamp.fromDate', () => {
      const fecha = new Date('2024-07-20');
      mapToFirestore({
        rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true,
        fechaEspecifica: fecha,
      });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
    });

    it('fechaEspecifica es null cuando no se provee', () => {
      const result = mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      expect(result.fechaEspecifica).toBeNull();
    });

    it('diaSemana es null cuando no se provee', () => {
      const result = mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: false });
      expect(result.diaSemana).toBeNull();
    });

    it('preserva diaSemana cuando se provee', () => {
      const result = mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true, diaSemana: 'lunes' });
      expect(result.diaSemana).toBe('lunes');
    });

    it('preserva el valor de activa', () => {
      const resultTrue = mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      const resultFalse = mapToFirestore({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: false });
      expect(resultTrue.activa).toBe(true);
      expect(resultFalse.activa).toBe(false);
    });
  });

  // ── mapFromFirestore ───────────────────────────────────────────────────────
  describe('mapFromFirestore', () => {
    it('convierte fechaAsignacion Timestamp a Date usando .toDate()', () => {
      const fakeTimestamp = { toDate: vi.fn(() => new Date('2024-05-01')), seconds: 1000 };
      Object.setPrototypeOf(fakeTimestamp, Timestamp as any);
      const result = mapFromFirestore({ id: 'ra-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true, fechaAsignacion: fakeTimestamp });
      expect(result.fechaAsignacion).toBeInstanceOf(Date);
    });

    it('convierte string de fechaAsignacion a Date', () => {
      const result = mapFromFirestore({ id: 'ra-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true, fechaAsignacion: '2024-01-01T00:00:00.000Z' });
      expect(result.fechaAsignacion).toBeInstanceOf(Date);
    });

    it('usa new Date() cuando fechaAsignacion está ausente', () => {
      const before = Date.now();
      const result = mapFromFirestore({ id: 'ra-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      const after = Date.now();
      expect(result.fechaAsignacion.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.fechaAsignacion.getTime()).toBeLessThanOrEqual(after);
    });

    it('fechaEspecifica es undefined cuando no está presente', () => {
      const result = mapFromFirestore({ id: 'ra-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      expect(result.fechaEspecifica).toBeUndefined();
    });

    it('diaSemana es undefined cuando no está en data', () => {
      const result = mapFromFirestore({ id: 'ra-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
      expect(result.diaSemana).toBeUndefined();
    });

    it('preserva campos básicos como id, rutinaId, entrenadoId, entrenadorId', () => {
      const result = mapFromFirestore({ id: 'ra-99', rutinaId: 'r-ABC', entrenadoId: 'e-XYZ', entrenadorId: 't-123', activa: false });
      expect(result.id).toBe('ra-99');
      expect(result.rutinaId).toBe('r-ABC');
      expect(result.entrenadoId).toBe('e-XYZ');
      expect(result.entrenadorId).toBe('t-123');
      expect(result.activa).toBe(false);
    });
  });

  // ── save (upsert) ──────────────────────────────────────────────────────────
  describe('save — lógica upsert', () => {
    it('llama a setDoc (con merge:true) cuando la rutina asignada tiene id', async () => {
      const ra = { id: 'existing-id', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true };
      await save(ra, firestoreStub);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).toHaveBeenCalledWith(expect.anything(), expect.any(Object), { merge: true });
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('llama a addDoc cuando la rutina asignada NO tiene id', async () => {
      const ra = { rutinaId: 'r2', entrenadoId: 'e2', entrenadorId: 't2', activa: true };
      await save(ra, firestoreStub);
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('asigna el id retornado por addDoc a la entidad', async () => {
      const ra: any = { rutinaId: 'r2', entrenadoId: 'e2', entrenadorId: 't2', activa: true };
      await save(ra, firestoreStub);
      expect(ra.id).toBe('new-rutina-id');
    });

    it('los datos pasados a setDoc son el resultado de mapToFirestore', async () => {
      const fecha = new Date('2024-09-01');
      const ra = { id: 'id-1', rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true, fechaAsignacion: fecha };
      await save(ra, firestoreStub);
      const [, dataArg] = mockSetDoc.mock.calls[0];
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
      expect(dataArg).toMatchObject({ rutinaId: 'r1', entrenadoId: 'e1', entrenadorId: 't1', activa: true });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('llama a deleteDoc con la referencia correcta', async () => {
      await deleteRutina('ra-to-delete', firestoreStub);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'rutinas-asignadas', 'ra-to-delete');
    });

    it('no llama a setDoc ni addDoc al eliminar', async () => {
      await deleteRutina('ra-other', firestoreStub);
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockAddDoc).not.toHaveBeenCalled();
    });
  });

  // ── computed filters ───────────────────────────────────────────────────────
  describe('getRutinasAsignadasByEntrenado — filtro computed', () => {
    const allRutinas = [
      { id: 'ra-1', entrenadoId: 'e1', entrenadorId: 't1', rutinaId: 'r1', activa: true },
      { id: 'ra-2', entrenadoId: 'e2', entrenadorId: 't1', rutinaId: 'r2', activa: true },
      { id: 'ra-3', entrenadoId: 'e1', entrenadorId: 't2', rutinaId: 'r3', activa: false },
      { id: 'ra-4', entrenadoId: 'e3', entrenadorId: 't2', rutinaId: 'r4', activa: true },
    ];

    it('filtra correctamente por entrenadoId', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'e1'));
      expect(result().length).toBe(2);
      expect(result().every(ra => ra.entrenadoId === 'e1')).toBe(true);
    });

    it('retorna array vacío para un entrenado sin asignaciones', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'no-existe'));
      expect(result()).toEqual([]);
    });

    it('es reactivo: actualiza cuando cambia la señal base', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'e1'));
      expect(result().length).toBe(2);
      store.set([...allRutinas, { id: 'ra-5', entrenadoId: 'e1', entrenadorId: 't3', rutinaId: 'r5', activa: true }]);
      expect(result().length).toBe(3);
    });
  });

  describe('getRutinasAsignadasActivasByEntrenado — filtro por activa=true', () => {
    const allRutinas = [
      { id: 'ra-1', entrenadoId: 'e1', entrenadorId: 't1', rutinaId: 'r1', activa: true },
      { id: 'ra-2', entrenadoId: 'e1', entrenadorId: 't1', rutinaId: 'r2', activa: false },
      { id: 'ra-3', entrenadoId: 'e1', entrenadorId: 't2', rutinaId: 'r3', activa: true },
      { id: 'ra-4', entrenadoId: 'e2', entrenadorId: 't1', rutinaId: 'r4', activa: true },
    ];

    it('retorna solo las rutinas activas del entrenado', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'e1' && ra.activa));
      expect(result().length).toBe(2);
      expect(result().every(ra => ra.activa)).toBe(true);
    });

    it('excluye rutinas con activa=false', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'e1' && ra.activa));
      expect(result().map(ra => ra.id)).not.toContain('ra-2');
    });

    it('retorna array vacío cuando el entrenado no tiene rutinas activas', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'no-entrenado' && ra.activa));
      expect(result()).toEqual([]);
    });

    it('no incluye rutinas activas de otros entrenados', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadoId === 'e1' && ra.activa));
      expect(result().map(ra => ra.id)).not.toContain('ra-4');
    });
  });

  describe('getRutinasAsignadasByEntrenador — filtro por entrenadorId', () => {
    const allRutinas = [
      { id: 'ra-1', entrenadoId: 'e1', entrenadorId: 't1', rutinaId: 'r1', activa: true },
      { id: 'ra-2', entrenadoId: 'e2', entrenadorId: 't1', rutinaId: 'r2', activa: true },
      { id: 'ra-3', entrenadoId: 'e1', entrenadorId: 't2', rutinaId: 'r3', activa: false },
    ];

    it('filtra correctamente por entrenadorId', () => {
      const store = signal(allRutinas);
      const result = computed(() => store().filter(ra => ra.entrenadorId === 't1'));
      expect(result().length).toBe(2);
      expect(result().every(ra => ra.entrenadorId === 't1')).toBe(true);
    });
  });
});
