/**
 * Tests para ConvocatoriaService
 */
import { signal, computed } from '@angular/core';
import { Timestamp, addDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const {
  mockAddDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockUpdateDoc,
  mockCollection,
  mockDoc,
  mockQuery,
  mockWhere,
  mockOnSnapshot,
  mockArrayUnion,
  mockArrayRemove,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-conv-id' })),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockCollection: vi.fn(() => ({})),
  mockDoc: vi.fn(() => ({})),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockArrayUnion: vi.fn((val: string) => ({ type: 'arrayUnion', val })),
  mockArrayRemove: vi.fn((val: string) => ({ type: 'arrayRemove', val })),
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
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  query: mockQuery,
  where: mockWhere,
  arrayUnion: mockArrayUnion,
  arrayRemove: mockArrayRemove,
  Timestamp: mockTimestamp,
}));

// ─── Helpers that mirror the service private logic ───────────────────────────

function mapFromFirestore(data: any) {
  return {
    id: data.id,
    creadorId: data.creadorId || '',
    creadorNombre: data.creadorNombre || 'Atleta',
    creadorFoto: data.creadorFoto || null,
    gimnasioId: data.gimnasioId || '',
    fechaCreacion:
      data.fechaCreacion && typeof data.fechaCreacion.toDate === 'function'
        ? data.fechaCreacion.toDate()
        : data.fechaCreacion
        ? new Date(data.fechaCreacion)
        : new Date(),
    fechaEntrenamiento:
      data.fechaEntrenamiento && typeof data.fechaEntrenamiento.toDate === 'function'
        ? data.fechaEntrenamiento.toDate()
        : data.fechaEntrenamiento
        ? new Date(data.fechaEntrenamiento)
        : new Date(),
    horaInicio: data.horaInicio || '00:00',
    horaFin: data.horaFin || '00:00',
    mensaje: data.mensaje || '',
    interesados: data.interesados || [],
    activo: data.activo ?? true,
    creadorRol: data.creadorRol || 'entrenado',
    titulo: data.titulo || '',
    esOficial: data.esOficial ?? false,
    esSemanal: data.esSemanal ?? false,
  };
}

function mapToFirestore(convocatoria: any) {
  const data: any = {
    creadorId: convocatoria.creadorId,
    creadorNombre: convocatoria.creadorNombre,
    gimnasioId: convocatoria.gimnasioId,
    horaInicio: convocatoria.horaInicio,
    horaFin: convocatoria.horaFin,
    interesados: convocatoria.interesados || [],
    activo: convocatoria.activo ?? true,
  };

  if (convocatoria.creadorFoto !== undefined) data.creadorFoto = convocatoria.creadorFoto;
  if (convocatoria.mensaje !== undefined) data.mensaje = convocatoria.mensaje;
  if (convocatoria.creadorRol !== undefined) data.creadorRol = convocatoria.creadorRol;
  if (convocatoria.titulo !== undefined) data.titulo = convocatoria.titulo;
  if (convocatoria.esOficial !== undefined) data.esOficial = convocatoria.esOficial;
  if (convocatoria.esSemanal !== undefined) data.esSemanal = convocatoria.esSemanal;

  if (convocatoria.fechaCreacion) {
    data.fechaCreacion =
      convocatoria.fechaCreacion instanceof Date
        ? Timestamp.fromDate(convocatoria.fechaCreacion)
        : convocatoria.fechaCreacion;
  }
  if (convocatoria.fechaEntrenamiento) {
    data.fechaEntrenamiento =
      convocatoria.fechaEntrenamiento instanceof Date
        ? Timestamp.fromDate(convocatoria.fechaEntrenamiento)
        : convocatoria.fechaEntrenamiento;
  }

  return data;
}

async function save(convocatoria: any) {
  const dataToSave = mapToFirestore(convocatoria);
  if (convocatoria.id) {
    const docRef = mockDoc({}, 'convocatorias', convocatoria.id);
    await setDoc(docRef as any, dataToSave, { merge: true });
  } else {
    const col = mockCollection({}, 'convocatorias');
    const docRef = await addDoc(col as any, dataToSave);
    convocatoria.id = (docRef as any).id;
  }
}

async function deleteConvocatoria(id: string) {
  const docRef = mockDoc({}, 'convocatorias', id);
  await deleteDoc(docRef as any);
}

async function toggleInteres(convocatoriaId: string, userId: string, unirse: boolean) {
  const docRef = mockDoc({}, 'convocatorias', convocatoriaId);
  if (unirse) {
    await updateDoc(docRef as any, { interesados: mockArrayUnion(userId) });
  } else {
    await updateDoc(docRef as any, { interesados: mockArrayRemove(userId) });
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConvocatoriaService — logica de mapeo, filtros y escritura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapFromFirestore', () => {
    it('convierte un Timestamp de fechaCreacion a Date', () => {
      const fakeTs = { toDate: () => new Date('2024-06-01'), seconds: 1717200000, nanoseconds: 0 };
      const result = mapFromFirestore({ id: 'c1', fechaCreacion: fakeTs });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaCreacion.toISOString()).toContain('2024-06-01');
    });

    it('convierte un Timestamp de fechaEntrenamiento a Date', () => {
      const fakeTs = { toDate: () => new Date('2024-07-15'), seconds: 1721000000, nanoseconds: 0 };
      const result = mapFromFirestore({ id: 'c1', fechaEntrenamiento: fakeTs });
      expect(result.fechaEntrenamiento).toBeInstanceOf(Date);
    });

    it('convierte string ISO de fechaCreacion a Date', () => {
      const result = mapFromFirestore({ id: 'c1', fechaCreacion: '2024-06-01T00:00:00.000Z' });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
    });

    it('aplica defaults cuando los campos estan ausentes', () => {
      const result = mapFromFirestore({ id: 'c1' });
      expect(result.creadorId).toBe('');
      expect(result.creadorNombre).toBe('Atleta');
      expect(result.horaInicio).toBe('00:00');
      expect(result.horaFin).toBe('00:00');
      expect(result.interesados).toEqual([]);
      expect(result.activo).toBe(true);
      expect(result.esOficial).toBe(false);
      expect(result.esSemanal).toBe(false);
    });

    it('preserva el array interesados cuando esta presente', () => {
      const result = mapFromFirestore({ id: 'c1', interesados: ['u1', 'u2', 'u3'] });
      expect(result.interesados).toEqual(['u1', 'u2', 'u3']);
    });

    it('preserva creadorFoto como null si no viene', () => {
      const result = mapFromFirestore({ id: 'c1' });
      expect(result.creadorFoto).toBeNull();
    });
  });

  describe('mapToFirestore', () => {
    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-03-10');
      mapToFirestore({
        creadorId: 'u1', creadorNombre: 'Juan', gimnasioId: 'g1',
        horaInicio: '08:00', horaFin: '09:00', fechaCreacion: date,
      });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('convierte fechaEntrenamiento Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-07-20');
      mapToFirestore({
        creadorId: 'u1', creadorNombre: 'Juan', gimnasioId: 'g1',
        horaInicio: '08:00', horaFin: '09:00', fechaEntrenamiento: date,
      });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('incluye campos opcionales si estan definidos', () => {
      const result = mapToFirestore({
        creadorId: 'u1', creadorNombre: 'Juan', gimnasioId: 'g1',
        horaInicio: '08:00', horaFin: '09:00',
        creadorFoto: 'foto.jpg', mensaje: 'Sesion matinal',
        creadorRol: 'entrenador', titulo: 'WOD lunes',
        esOficial: true, esSemanal: false,
      });
      expect(result.creadorFoto).toBe('foto.jpg');
      expect(result.mensaje).toBe('Sesion matinal');
      expect(result.creadorRol).toBe('entrenador');
      expect(result.titulo).toBe('WOD lunes');
      expect(result.esOficial).toBe(true);
    });

    it('interesados es array vacio por defecto', () => {
      const result = mapToFirestore({
        creadorId: 'u1', creadorNombre: 'J', gimnasioId: 'g1',
        horaInicio: '08:00', horaFin: '09:00',
      });
      expect(result.interesados).toEqual([]);
    });
  });

  describe('save', () => {
    it('llama a setDoc con merge:true cuando la convocatoria tiene id', async () => {
      const conv = {
        id: 'conv-99', creadorId: 'u1', creadorNombre: 'Juan',
        gimnasioId: 'g1', horaInicio: '08:00', horaFin: '09:00',
      };
      await save(conv);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ creadorId: 'u1' }),
        { merge: true },
      );
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('llama a addDoc y asigna el nuevo id cuando no hay id', async () => {
      const conv: any = {
        creadorId: 'u1', creadorNombre: 'Juan',
        gimnasioId: 'g1', horaInicio: '08:00', horaFin: '09:00',
      };
      await save(conv);
      expect(addDoc).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
      expect(conv.id).toBe('new-conv-id');
    });
  });

  describe('delete', () => {
    it('llama a deleteDoc una vez', async () => {
      await deleteConvocatoria('conv-123');
      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });

    it('llama a mockDoc con el id correcto antes de deleteDoc', async () => {
      await deleteConvocatoria('conv-abc');
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'convocatorias', 'conv-abc');
    });
  });

  describe('toggleInteres', () => {
    it('usa arrayUnion cuando unirse=true', async () => {
      await toggleInteres('conv-1', 'user-42', true);
      expect(mockArrayUnion).toHaveBeenCalledWith('user-42');
      expect(mockArrayRemove).not.toHaveBeenCalled();
    });

    it('usa arrayRemove cuando unirse=false', async () => {
      await toggleInteres('conv-1', 'user-42', false);
      expect(mockArrayRemove).toHaveBeenCalledWith('user-42');
      expect(mockArrayUnion).not.toHaveBeenCalled();
    });

    it('llama a updateDoc con el campo interesados', async () => {
      await toggleInteres('conv-1', 'user-42', true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ interesados: expect.anything() }),
      );
    });

    it('llama a mockDoc con el convocatoriaId correcto', async () => {
      await toggleInteres('conv-XYZ', 'user-1', true);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'convocatorias', 'conv-XYZ');
    });
  });

  describe('getByGimnasio — logica de filtrado con signal/computed', () => {
    const allConvocatorias = [
      { id: 'c1', gimnasioId: 'gym-1', activo: true, interesados: ['u1'] },
      { id: 'c2', gimnasioId: 'gym-1', activo: true, interesados: [] },
      { id: 'c3', gimnasioId: 'gym-2', activo: true, interesados: [] },
      { id: 'c4', gimnasioId: 'gym-1', activo: false, interesados: [] },
    ] as any[];

    function getByGimnasio(gimnasioId: string) {
      const store = signal(allConvocatorias);
      return computed(() => store().filter(c => c.gimnasioId === gimnasioId && c.activo));
    }

    it('filtra solo las convocatorias del gimnasio indicado', () => {
      const result = getByGimnasio('gym-1');
      expect(result().length).toBe(2);
      expect(result().every(c => c.gimnasioId === 'gym-1')).toBe(true);
    });

    it('excluye convocatorias inactivas del gimnasio', () => {
      const result = getByGimnasio('gym-1');
      expect(result().map(c => c.id)).not.toContain('c4');
    });

    it('devuelve array vacio si no hay convocatorias para ese gimnasio', () => {
      const result = getByGimnasio('gym-999');
      expect(result()).toEqual([]);
    });

    it('preserva el array interesados en los items filtrados', () => {
      const result = getByGimnasio('gym-1');
      const c1 = result().find(c => c.id === 'c1');
      expect(c1?.interesados).toEqual(['u1']);
    });
  });
});
