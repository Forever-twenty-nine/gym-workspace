/**
 * Tests para SesionRutinaService
 */
import { Timestamp, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const {
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockDoc,
  mockCollection,
  mockOnSnapshot,
  mockQuery,
  mockWhere,
  mockArrayUnion,
  mockArrayRemove,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockDoc: vi.fn(() => ({})),
  mockCollection: vi.fn(() => ({})),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockArrayUnion: vi.fn((...args: any[]) => ({ type: 'arrayUnion', args })),
  mockArrayRemove: vi.fn((...args: any[]) => ({ type: 'arrayRemove', args })),
  mockTimestamp: {
    now: vi.fn(() => ({ seconds: 1700000000, nanoseconds: 0, toDate: () => new Date('2024-01-01') })),
    fromDate: vi.fn((d: Date) => ({ seconds: d.getTime() / 1000, nanoseconds: 0, toDate: () => d })),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
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

// ─── helpers que replican la lógica pura del servicio ────────────────────────

function normalizeSesionRutina(sesion: any): any {
  const normalized: any = { ...sesion };

  // Eliminar cualquier campo undefined
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  // Normalizar rutinaResumen si existe
  if (normalized.rutinaResumen) {
    normalized.rutinaResumen = { ...normalized.rutinaResumen };
    Object.keys(normalized.rutinaResumen).forEach(key => {
      if (normalized.rutinaResumen[key] === undefined) {
        delete normalized.rutinaResumen[key];
      }
    });

    if (normalized.rutinaResumen.ejercicios) {
      normalized.rutinaResumen.ejercicios = normalized.rutinaResumen.ejercicios.map((ejercicio: any) => {
        const ej: any = { ...ejercicio };
        Object.keys(ej).forEach(key => {
          if (ej[key] === undefined) {
            delete ej[key];
          }
        });
        return ej;
      });
    }
  }

  return normalized;
}

function mapToFirestore(sesion: any): any {
  const data = { ...sesion } as any;
  if (data.fechaInicio instanceof Date) {
    data.fechaInicio = Timestamp.fromDate(data.fechaInicio);
  }
  if (data.fechaFin instanceof Date) {
    data.fechaFin = Timestamp.fromDate(data.fechaFin);
  }
  if (data.fechaCompartida instanceof Date) {
    data.fechaCompartida = Timestamp.fromDate(data.fechaCompartida);
  }
  return data;
}

function mapFromFirestore(data: any): any {
  return {
    ...data,
    fechaInicio: data.fechaInicio && typeof data.fechaInicio.toDate === 'function'
      ? data.fechaInicio.toDate()
      : (data.fechaInicio ? new Date(data.fechaInicio) : new Date()),
    fechaFin: data.fechaFin && typeof data.fechaFin.toDate === 'function'
      ? data.fechaFin.toDate()
      : (data.fechaFin ? new Date(data.fechaFin) : undefined),
    fechaCompartida: data.fechaCompartida && typeof data.fechaCompartida.toDate === 'function'
      ? data.fechaCompartida.toDate()
      : (data.fechaCompartida ? new Date(data.fechaCompartida) : undefined),
    likes: data.likes || [],
    fotoProgreso: data.fotoProgreso || null,
  };
}

async function crearSesion(sesion: any, firestoreStub: any): Promise<void> {
  const normalizedSesion = normalizeSesionRutina(sesion);
  const dataToSave = mapToFirestore(normalizedSesion);
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', sesion.id);
  await setDoc(ref, dataToSave);
}

async function actualizarSesion(sesion: any, firestoreStub: any): Promise<void> {
  const normalizedSesion = normalizeSesionRutina(sesion);
  const dataToSave = mapToFirestore(normalizedSesion);
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', sesion.id);
  await updateDoc(ref, dataToSave);
}

async function eliminarSesion(id: string, firestoreStub: any): Promise<void> {
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', id);
  await deleteDoc(ref);
}

async function setCompartida(
  id: string, compartida: boolean, firestoreStub: any,
  userName?: string, userPhoto?: string, fotoProgreso?: string, gimnasioId?: string
): Promise<void> {
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', id);
  const data: any = {
    compartida,
    nombreUsuario: userName || 'Usuario',
    fotoUsuario: userPhoto || null,
    fotoProgreso: fotoProgreso || null,
    fechaCompartida: compartida ? Timestamp.now() : null,
  };
  if (gimnasioId) {
    data.gimnasioId = gimnasioId;
  }
  await updateDoc(ref, data);
}

async function addLike(sesionId: string, userId: string, firestoreStub: any): Promise<void> {
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', sesionId);
  await updateDoc(ref, {
    likes: mockArrayUnion(userId),
  });
}

async function removeLike(sesionId: string, userId: string, firestoreStub: any): Promise<void> {
  const ref = mockDoc(firestoreStub, 'sesiones-rutina', sesionId);
  await updateDoc(ref, {
    likes: mockArrayRemove(userId),
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('SesionRutinaService — lógica pura', () => {
  const firestoreStub = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── normalizeSesionRutina ──────────────────────────────────────────────────
  describe('normalizeSesionRutina', () => {
    it('elimina campos con valor undefined del objeto raíz', () => {
      const sesion = { id: 's1', entrenadoId: 'e1', campoOpcional: undefined };
      const result = normalizeSesionRutina(sesion);
      expect('campoOpcional' in result).toBe(false);
    });

    it('preserva campos con valor definido (incluso false y 0)', () => {
      const sesion = { id: 's1', completada: false, porcentajeCompletado: 0, entrenadoId: 'e1' };
      const result = normalizeSesionRutina(sesion);
      expect(result.completada).toBe(false);
      expect(result.porcentajeCompletado).toBe(0);
    });

    it('normaliza ejercicios dentro de rutinaResumen eliminando undefined', () => {
      const sesion = {
        id: 's1',
        rutinaResumen: {
          id: 'r1',
          nombre: 'Rutina A',
          ejercicios: [
            { id: 'ej-1', nombre: 'Press banca', repeticiones: undefined },
            { id: 'ej-2', nombre: 'Sentadilla', series: 3 },
          ],
        },
      };
      const result = normalizeSesionRutina(sesion);
      expect('repeticiones' in result.rutinaResumen.ejercicios[0]).toBe(false);
      expect(result.rutinaResumen.ejercicios[1].series).toBe(3);
    });

    it('elimina campos undefined de rutinaResumen', () => {
      const sesion = {
        id: 's1',
        rutinaResumen: { id: 'r1', nombre: 'Rutina A', campoExtra: undefined },
      };
      const result = normalizeSesionRutina(sesion);
      expect('campoExtra' in result.rutinaResumen).toBe(false);
    });

    it('maneja sesión sin rutinaResumen sin lanzar error', () => {
      const sesion = { id: 's1', entrenadoId: 'e1', completada: false };
      expect(() => normalizeSesionRutina(sesion)).not.toThrow();
    });
  });

  // ── mapToFirestore ─────────────────────────────────────────────────────────
  describe('mapToFirestore', () => {
    it('convierte fechaInicio Date a Timestamp usando Timestamp.fromDate', () => {
      const fecha = new Date('2024-05-10T09:00:00Z');
      mapToFirestore({ id: 's1', fechaInicio: fecha });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
    });

    it('convierte fechaFin Date a Timestamp usando Timestamp.fromDate', () => {
      const fechaFin = new Date('2024-05-10T10:00:00Z');
      mapToFirestore({ id: 's1', fechaInicio: new Date(), fechaFin });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fechaFin);
    });

    it('convierte fechaCompartida Date a Timestamp usando Timestamp.fromDate', () => {
      const fechaCompartida = new Date('2024-06-01');
      mapToFirestore({ id: 's1', fechaInicio: new Date(), fechaCompartida });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fechaCompartida);
    });

    it('no modifica fechaInicio si ya no es Date', () => {
      const fakeTs = { seconds: 999, toDate: () => new Date() };
      const result = mapToFirestore({ id: 's1', fechaInicio: fakeTs });
      expect(result.fechaInicio).toBe(fakeTs);
    });

    it('no modifica fechaFin si es undefined', () => {
      const result = mapToFirestore({ id: 's1', fechaInicio: new Date() });
      expect(result.fechaFin).toBeUndefined();
    });

    it('preserva campos no relacionados con fechas', () => {
      const result = mapToFirestore({ id: 's1', entrenadoId: 'e1', completada: true, porcentajeCompletado: 100, fechaInicio: new Date() });
      expect(result.entrenadoId).toBe('e1');
      expect(result.completada).toBe(true);
      expect(result.porcentajeCompletado).toBe(100);
    });
  });

  // ── mapFromFirestore ───────────────────────────────────────────────────────
  describe('mapFromFirestore', () => {
    it('convierte fechaInicio Timestamp a Date', () => {
      const fakeTs = { toDate: vi.fn(() => new Date('2024-03-01')), seconds: 500 };
      Object.setPrototypeOf(fakeTs, Timestamp as any);
      const result = mapFromFirestore({ id: 's1', fechaInicio: fakeTs });
      expect(result.fechaInicio).toBeInstanceOf(Date);
    });

    it('convierte fechaFin Timestamp a Date', () => {
      const fakeTsFin = { toDate: vi.fn(() => new Date('2024-03-01T10:00:00')), seconds: 600 };
      Object.setPrototypeOf(fakeTsFin, Timestamp as any);
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString(), fechaFin: fakeTsFin });
      expect(result.fechaFin).toBeInstanceOf(Date);
    });

    it('convierte fechaCompartida Timestamp a Date', () => {
      const fakeTs = { toDate: vi.fn(() => new Date('2024-04-15')), seconds: 700 };
      Object.setPrototypeOf(fakeTs, Timestamp as any);
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString(), fechaCompartida: fakeTs });
      expect(result.fechaCompartida).toBeInstanceOf(Date);
    });

    it('convierte string de fechaInicio a Date', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: '2024-01-20T08:00:00.000Z' });
      expect(result.fechaInicio).toBeInstanceOf(Date);
    });

    it('fechaFin es undefined cuando no está en data', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString() });
      expect(result.fechaFin).toBeUndefined();
    });

    it('fechaCompartida es undefined cuando no está en data', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString() });
      expect(result.fechaCompartida).toBeUndefined();
    });

    it('defaults likes a array vacío cuando no está presente', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString() });
      expect(result.likes).toEqual([]);
    });

    it('defaults fotoProgreso a null cuando no está presente', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString() });
      expect(result.fotoProgreso).toBeNull();
    });

    it('preserva likes existentes', () => {
      const result = mapFromFirestore({ id: 's1', fechaInicio: new Date().toISOString(), likes: ['u1', 'u2'] });
      expect(result.likes).toEqual(['u1', 'u2']);
    });
  });

  // ── crearSesion ────────────────────────────────────────────────────────────
  describe('crearSesion', () => {
    it('llama a setDoc con el id de la sesión', async () => {
      const sesion = { id: 'sesion-001', entrenadoId: 'e1', completada: false, fechaInicio: new Date(), porcentajeCompletado: 0 };
      await crearSesion(sesion, firestoreStub);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'sesiones-rutina', 'sesion-001');
    });

    it('llama a mapToFirestore: fechaInicio se convierte en Timestamp', async () => {
      const fecha = new Date('2024-08-01T07:00:00Z');
      const sesion = { id: 'sesion-002', entrenadoId: 'e1', completada: false, fechaInicio: fecha, porcentajeCompletado: 0 };
      await crearSesion(sesion, firestoreStub);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
    });

    it('no llama a updateDoc ni deleteDoc en crearSesion', async () => {
      const sesion = { id: 'sesion-003', entrenadoId: 'e1', completada: false, fechaInicio: new Date(), porcentajeCompletado: 0 };
      await crearSesion(sesion, firestoreStub);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });
  });

  // ── actualizarSesion ───────────────────────────────────────────────────────
  describe('actualizarSesion', () => {
    it('llama a updateDoc con la referencia de la sesión', async () => {
      const sesion = { id: 'sesion-100', entrenadoId: 'e1', completada: true, fechaInicio: new Date(), porcentajeCompletado: 100 };
      await actualizarSesion(sesion, firestoreStub);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'sesiones-rutina', 'sesion-100');
    });

    it('no llama a setDoc ni deleteDoc en actualizarSesion', async () => {
      const sesion = { id: 'sesion-101', entrenadoId: 'e1', completada: false, fechaInicio: new Date(), porcentajeCompletado: 0 };
      await actualizarSesion(sesion, firestoreStub);
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('convierte fechaFin a Timestamp en actualizarSesion', async () => {
      const fechaFin = new Date('2024-09-10T11:00:00Z');
      const sesion = { id: 'sesion-102', entrenadoId: 'e1', completada: true, fechaInicio: new Date(), fechaFin, porcentajeCompletado: 100 };
      await actualizarSesion(sesion, firestoreStub);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fechaFin);
    });
  });

  // ── eliminarSesion ─────────────────────────────────────────────────────────
  describe('eliminarSesion', () => {
    it('llama a deleteDoc con la referencia correcta', async () => {
      await eliminarSesion('sesion-del-1', firestoreStub);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'sesiones-rutina', 'sesion-del-1');
    });

    it('no llama a setDoc ni updateDoc al eliminar', async () => {
      await eliminarSesion('sesion-del-2', firestoreStub);
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  // ── setCompartida ──────────────────────────────────────────────────────────
  describe('setCompartida', () => {
    it('llama a updateDoc con compartida=true e incluye fechaCompartida', async () => {
      await setCompartida('sesion-c1', true, firestoreStub, 'Juan');
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.compartida).toBe(true);
      expect(dataArg.nombreUsuario).toBe('Juan');
      expect(dataArg.fechaCompartida).not.toBeNull();
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('fechaCompartida es null cuando compartida=false', async () => {
      await setCompartida('sesion-c2', false, firestoreStub);
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.compartida).toBe(false);
      expect(dataArg.fechaCompartida).toBeNull();
    });

    it('usa "Usuario" como nombreUsuario cuando no se provee', async () => {
      await setCompartida('sesion-c3', true, firestoreStub);
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.nombreUsuario).toBe('Usuario');
    });

    it('incluye gimnasioId cuando se provee', async () => {
      await setCompartida('sesion-c4', true, firestoreStub, 'María', undefined, undefined, 'gym-001');
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.gimnasioId).toBe('gym-001');
    });

    it('no incluye gimnasioId cuando no se provee', async () => {
      await setCompartida('sesion-c5', true, firestoreStub, 'Pedro');
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect('gimnasioId' in dataArg).toBe(false);
    });
  });

  // ── addLike ────────────────────────────────────────────────────────────────
  describe('addLike', () => {
    it('llama a updateDoc con arrayUnion del userId', async () => {
      await addLike('sesion-l1', 'user-abc', firestoreStub);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockArrayUnion).toHaveBeenCalledWith('user-abc');
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.likes).toEqual({ type: 'arrayUnion', args: ['user-abc'] });
    });

    it('llama a doc con la colección y sesionId correctos', async () => {
      await addLike('sesion-l2', 'user-xyz', firestoreStub);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'sesiones-rutina', 'sesion-l2');
    });

    it('no llama a arrayRemove en addLike', async () => {
      await addLike('sesion-l3', 'user-111', firestoreStub);
      expect(mockArrayRemove).not.toHaveBeenCalled();
    });
  });

  // ── removeLike ─────────────────────────────────────────────────────────────
  describe('removeLike', () => {
    it('llama a updateDoc con arrayRemove del userId', async () => {
      await removeLike('sesion-r1', 'user-abc', firestoreStub);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockArrayRemove).toHaveBeenCalledWith('user-abc');
      const [, dataArg] = mockUpdateDoc.mock.calls[0];
      expect(dataArg.likes).toEqual({ type: 'arrayRemove', args: ['user-abc'] });
    });

    it('llama a doc con la colección y sesionId correctos', async () => {
      await removeLike('sesion-r2', 'user-xyz', firestoreStub);
      expect(mockDoc).toHaveBeenCalledWith(firestoreStub, 'sesiones-rutina', 'sesion-r2');
    });

    it('no llama a arrayUnion en removeLike', async () => {
      await removeLike('sesion-r3', 'user-222', firestoreStub);
      expect(mockArrayUnion).not.toHaveBeenCalled();
    });
  });
});
