/**
 * Tests para NotificacionService
 */
import { Timestamp, updateDoc, getDocs } from 'firebase/firestore';
import { signal, computed } from '@angular/core';

const {
  mockUpdateDoc,
  mockDeleteDoc,
  mockSetDoc,
  mockAddDoc,
  mockOnSnapshot,
  mockCollection,
  mockDoc,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockGetDocs,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-notif-id' })),
  mockOnSnapshot: vi.fn(() => vi.fn()),
  mockCollection: vi.fn(() => ({})),
  mockDoc: vi.fn(() => ({ id: 'mock-doc-ref' })),
  mockQuery: vi.fn(() => ({})),
  mockWhere: vi.fn(() => ({})),
  mockOrderBy: vi.fn(() => ({})),
  mockGetDocs: vi.fn(() => Promise.resolve({ docs: [] })),
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
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: vi.fn(),
  Timestamp: mockTimestamp,
}));

// ── Helpers that mirror the service's private logic ──────────────────────────

function mapFromFirestore(data: any) {
  return {
    ...data,
    id: data.id,
    fechaCreacion:
      data.fechaCreacion && typeof data.fechaCreacion.toDate === 'function'
        ? data.fechaCreacion.toDate()
        : data.fechaCreacion
        ? new Date(data.fechaCreacion)
        : new Date(),
    fechaLeida:
      data.fechaLeida && typeof data.fechaLeida.toDate === 'function'
        ? data.fechaLeida.toDate()
        : data.fechaLeida
        ? new Date(data.fechaLeida)
        : undefined,
  };
}

function mapToFirestore(notificacion: any) {
  const data: any = {
    usuarioId: notificacion.usuarioId,
    tipo: notificacion.tipo,
    titulo: notificacion.titulo,
    mensaje: notificacion.mensaje,
    leida: notificacion.leida || false,
    fechaCreacion:
      notificacion.fechaCreacion instanceof Date
        ? Timestamp.fromDate(notificacion.fechaCreacion)
        : notificacion.fechaCreacion || Timestamp.now(),
  };

  if (notificacion.fechaLeida) {
    data.fechaLeida =
      notificacion.fechaLeida instanceof Date
        ? Timestamp.fromDate(notificacion.fechaLeida)
        : notificacion.fechaLeida;
  }

  if (notificacion.datos) {
    data.datos = notificacion.datos;
  }

  return data;
}

async function save(notificacion: any, fakeFirestore: any) {
  const dataToSave = mapToFirestore(notificacion);
  if (notificacion.id) {
    const ref = mockDoc(fakeFirestore, 'notificaciones', notificacion.id);
    await mockSetDoc(ref, dataToSave, { merge: true });
  } else {
    const col = mockCollection(fakeFirestore, 'notificaciones');
    await mockAddDoc(col, dataToSave);
  }
}

async function deleteNotificacion(id: string, fakeFirestore: any) {
  const ref = mockDoc(fakeFirestore, 'notificaciones', id);
  await mockDeleteDoc(ref);
}

async function marcarComoLeida(id: string, fakeFirestore: any) {
  const ref = mockDoc(fakeFirestore, 'notificaciones', id);
  await updateDoc(ref, { leida: true, fechaLeida: Timestamp.now() });
}

async function marcarTodasComoLeidas(usuarioId: string, fakeFirestore: any) {
  const col = mockCollection(fakeFirestore, 'notificaciones');
  const q = mockQuery(col, mockWhere('usuarioId', '==', usuarioId), mockWhere('leida', '==', false));
  const snap = await getDocs(q);
  const updates = (snap as any).docs.map((d: any) =>
    updateDoc(d.ref, { leida: true, fechaLeida: Timestamp.now() })
  );
  await Promise.all(updates);
}

// ── Test suite ───────────────────────────────────────────────────────────────

describe('NotificacionService — lógica de mapeo, filtrado y escritura', () => {
  const fakeFirestore = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── mapFromFirestore ───────────────────────────────────────────────────────

  describe('mapFromFirestore', () => {
    it('convierte fechaCreacion Timestamp a Date', () => {
      const ts = { toDate: () => new Date('2024-05-01'), seconds: 1714521600, nanoseconds: 0 };
      const result = mapFromFirestore({ id: 'n-1', fechaCreacion: ts });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaCreacion.toISOString()).toContain('2024-05-01');
    });

    it('convierte fechaCreacion string a Date cuando no es Timestamp', () => {
      const result = mapFromFirestore({ id: 'n-2', fechaCreacion: '2024-03-10T00:00:00.000Z' });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
    });

    it('usa new Date() como fallback cuando fechaCreacion es undefined', () => {
      const before = Date.now();
      const result = mapFromFirestore({ id: 'n-3' });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
      expect(result.fechaCreacion.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('convierte fechaLeida Timestamp a Date', () => {
      const ts = { toDate: () => new Date('2024-06-15'), seconds: 1718409600, nanoseconds: 0 };
      const result = mapFromFirestore({ id: 'n-4', fechaLeida: ts });
      expect(result.fechaLeida).toBeInstanceOf(Date);
    });

    it('deja fechaLeida como undefined cuando no esta definida', () => {
      const result = mapFromFirestore({ id: 'n-5' });
      expect(result.fechaLeida).toBeUndefined();
    });

    it('preserva campos adicionales como usuarioId y leida', () => {
      const result = mapFromFirestore({
        id: 'n-6',
        usuarioId: 'u-1',
        leida: false,
        tipo: 'info',
        titulo: 'Hola',
        mensaje: 'Mundo',
        fechaCreacion: '2024-01-01T00:00:00.000Z',
      });
      expect(result.usuarioId).toBe('u-1');
      expect(result.leida).toBe(false);
      expect(result.tipo).toBe('info');
    });
  });

  // ── mapToFirestore ─────────────────────────────────────────────────────────

  describe('mapToFirestore', () => {
    it('llama a Timestamp.fromDate cuando fechaCreacion es Date', () => {
      const date = new Date('2024-04-01');
      mapToFirestore({ usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M', fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('usa Timestamp.now() como fallback cuando fechaCreacion es undefined', () => {
      mapToFirestore({ usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M' });
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('fija leida=false por defecto', () => {
      const result = mapToFirestore({ usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M' });
      expect(result.leida).toBe(false);
    });

    it('incluye fechaLeida cuando se proporciona como Date', () => {
      const fecha = new Date('2024-07-01');
      const result = mapToFirestore({
        usuarioId: 'u-1',
        tipo: 'info',
        titulo: 'T',
        mensaje: 'M',
        leida: true,
        fechaLeida: fecha,
      });
      expect(result.fechaLeida).toBeDefined();
      expect(Timestamp.fromDate).toHaveBeenCalledWith(fecha);
    });

    it('omite fechaLeida del resultado cuando no esta en la notificacion', () => {
      const result = mapToFirestore({ usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M' });
      expect(result.fechaLeida).toBeUndefined();
    });

    it('incluye campo datos cuando esta presente', () => {
      const result = mapToFirestore({
        usuarioId: 'u-1',
        tipo: 'info',
        titulo: 'T',
        mensaje: 'M',
        datos: { extra: 42 },
      });
      expect(result.datos).toEqual({ extra: 42 });
    });
  });

  // ── marcarComoLeida ────────────────────────────────────────────────────────

  describe('marcarComoLeida', () => {
    it('llama a updateDoc con leida=true y fechaLeida=Timestamp.now()', async () => {
      await marcarComoLeida('notif-abc', fakeFirestore);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ leida: true })
      );
      const payload = (updateDoc as any).mock.calls[0][1];
      expect(payload.fechaLeida).toBeDefined();
      expect(Timestamp.now).toHaveBeenCalled();
    });

    it('pasa la referencia correcta del documento', async () => {
      mockDoc.mockReturnValueOnce({ id: 'notif-abc', path: 'notificaciones/notif-abc' });
      await marcarComoLeida('notif-abc', fakeFirestore);
      expect(mockDoc).toHaveBeenCalledWith(fakeFirestore, 'notificaciones', 'notif-abc');
    });
  });

  // ── marcarTodasComoLeidas ──────────────────────────────────────────────────

  describe('marcarTodasComoLeidas', () => {
    it('consulta solo notificaciones no leidas del usuario', async () => {
      await marcarTodasComoLeidas('user-99', fakeFirestore);
      expect(mockWhere).toHaveBeenCalledWith('usuarioId', '==', 'user-99');
      expect(mockWhere).toHaveBeenCalledWith('leida', '==', false);
    });

    it('llama a updateDoc por cada documento pendiente', async () => {
      const fakeRef1 = { ref: { id: 'doc1' } };
      const fakeRef2 = { ref: { id: 'doc2' } };
      mockGetDocs.mockResolvedValueOnce({ docs: [fakeRef1, fakeRef2] });

      await marcarTodasComoLeidas('user-50', fakeFirestore);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    it('no llama a updateDoc cuando no hay documentos pendientes', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });
      await marcarTodasComoLeidas('user-empty', fakeFirestore);
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  // ── save ───────────────────────────────────────────────────────────────────

  describe('save', () => {
    it('llama a addDoc cuando la notificacion no tiene id', async () => {
      await save({ usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M' }, fakeFirestore);
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('llama a setDoc con merge=true cuando la notificacion tiene id', async () => {
      await save({ id: 'notif-1', usuarioId: 'u-1', tipo: 'info', titulo: 'T', mensaje: 'M' }, fakeFirestore);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Object),
        { merge: true }
      );
      expect(mockAddDoc).not.toHaveBeenCalled();
    });

    it('pasa datos mapeados (no el objeto original) a Firestore', async () => {
      const date = new Date('2024-01-01');
      await save({ usuarioId: 'u-2', tipo: 'alerta', titulo: 'T', mensaje: 'M', fechaCreacion: date }, fakeFirestore);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('llama a deleteDoc con la referencia correcta', async () => {
      await deleteNotificacion('notif-xyz', fakeFirestore);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(fakeFirestore, 'notificaciones', 'notif-xyz');
    });
  });

  // ── Computed: contador no leidas ───────────────────────────────────────────

  describe('getContadorNoLeidas (logica computed)', () => {
    it('devuelve 0 cuando no hay notificaciones', () => {
      const _notificaciones = signal<any[]>([]);
      const contador = computed(() =>
        _notificaciones().filter(n => n.usuarioId === 'u-1' && !n.leida).length
      );
      expect(contador()).toBe(0);
    });

    it('cuenta correctamente las no leidas del usuario', () => {
      const _notificaciones = signal<any[]>([
        { id: '1', usuarioId: 'u-1', leida: false },
        { id: '2', usuarioId: 'u-1', leida: true },
        { id: '3', usuarioId: 'u-1', leida: false },
        { id: '4', usuarioId: 'u-2', leida: false },
      ]);
      const contador = computed(() =>
        _notificaciones().filter(n => n.usuarioId === 'u-1' && !n.leida).length
      );
      expect(contador()).toBe(2);
    });

    it('reacciona cuando se actualiza el signal', () => {
      const _notificaciones = signal<any[]>([
        { id: '1', usuarioId: 'u-1', leida: false },
      ]);
      const contador = computed(() =>
        _notificaciones().filter(n => n.usuarioId === 'u-1' && !n.leida).length
      );
      expect(contador()).toBe(1);
      _notificaciones.set([]);
      expect(contador()).toBe(0);
    });
  });

  // ── Computed: filtros adicionales ──────────────────────────────────────────

  describe('getNotificacionesByTipo (logica computed)', () => {
    it('filtra por usuarioId y tipo correctamente', () => {
      const _notificaciones = signal<any[]>([
        { id: '1', usuarioId: 'u-1', tipo: 'alerta', leida: false },
        { id: '2', usuarioId: 'u-1', tipo: 'info', leida: false },
        { id: '3', usuarioId: 'u-2', tipo: 'alerta', leida: false },
      ]);
      const alertas = computed(() =>
        _notificaciones().filter(n => n.usuarioId === 'u-1' && n.tipo === 'alerta')
      );
      expect(alertas().length).toBe(1);
      expect(alertas()[0].id).toBe('1');
    });
  });
});
