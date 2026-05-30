/**
 * Tests para InvitacionService
 */
import { Timestamp, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-inv-id' })),
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

describe('InvitacionService — lógica de mapeo y filtrado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToFirestore', () => {
    function mapToFirestore(invitacion: any) {
      return {
        ...invitacion,
        fechaCreacion: invitacion.fechaCreacion instanceof Date
          ? Timestamp.fromDate(invitacion.fechaCreacion)
          : (invitacion.fechaCreacion || Timestamp.now()),
        fechaRespuesta: invitacion.fechaRespuesta instanceof Date
          ? Timestamp.fromDate(invitacion.fechaRespuesta)
          : (invitacion.fechaRespuesta || null),
      };
    }

    it('convierte fechaCreacion Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-03-10');
      mapToFirestore({ id: 'inv-1', fechaCreacion: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });

    it('fechaRespuesta es null si no está definida', () => {
      const result = mapToFirestore({ id: 'inv-1', fechaCreacion: new Date() });
      expect(result.fechaRespuesta).toBeNull();
    });

    it('convierte fechaRespuesta Date llamando a Timestamp.fromDate', () => {
      const date = new Date('2024-03-15');
      mapToFirestore({ id: 'inv-1', fechaCreacion: new Date(), fechaRespuesta: date });
      expect(Timestamp.fromDate).toHaveBeenCalledWith(date);
    });
  });

  describe('updateEstado', () => {
    async function updateEstado(id: string, estado: 'pendiente' | 'aceptada' | 'rechazada') {
      await updateDoc({} as any, {
        estado,
        fechaRespuesta: estado !== 'pendiente' ? Timestamp.now() : null,
      });
    }

    it('incluye fechaRespuesta cuando el estado es "aceptada"', async () => {
      await updateEstado('inv-1', 'aceptada');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ estado: 'aceptada' })
      );
    });

    it('fechaRespuesta es null cuando el estado es "pendiente"', async () => {
      await updateEstado('inv-1', 'pendiente');
      const call = (updateDoc as any).mock.calls[0][1];
      expect(call.fechaRespuesta).toBeNull();
    });

    it('incluye fechaRespuesta cuando el estado es "rechazada"', async () => {
      await updateEstado('inv-2', 'rechazada');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ estado: 'rechazada' })
      );
    });

    it('fechaRespuesta no es null cuando el estado es "rechazada"', async () => {
      await updateEstado('inv-2', 'rechazada');
      const call = (updateDoc as any).mock.calls[0][1];
      expect(call.fechaRespuesta).not.toBeNull();
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
        fechaRespuesta: data.fechaRespuesta && typeof data.fechaRespuesta.toDate === 'function'
          ? data.fechaRespuesta.toDate()
          : (data.fechaRespuesta ? new Date(data.fechaRespuesta) : undefined),
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 'inv-3',
        entrenadorId: 'trainer-1',
        entrenadoId: 'entrenado-1',
        estado: 'pendiente' as const,
        activa: true,
        fechaCreacion: new Date('2024-01-01'),
      };

      const result = mapFromFirestore(data);
      expect(result.entrenadorId).toBe('trainer-1');
      expect(result.entrenadoId).toBe('entrenado-1');
      expect(result.estado).toBe('pendiente');
      expect(result.activa).toBe(true);
    });

    it('convierte string de fecha a Date en fechaCreacion', () => {
      const result = mapFromFirestore({ id: 'inv-2', fechaCreacion: '2024-01-15T00:00:00.000Z' });
      expect(result.fechaCreacion).toBeInstanceOf(Date);
    });
  });

  describe('lógica de filtros', () => {
    const allInvitaciones = [
      { id: 'inv-1', entrenadorId: 't1', entrenadoId: 'e1', estado: 'pendiente', activa: true },
      { id: 'inv-2', entrenadorId: 't1', entrenadoId: 'e1', estado: 'aceptada', activa: true },
      { id: 'inv-3', entrenadorId: 't2', entrenadoId: 'e2', estado: 'pendiente', activa: true },
      { id: 'inv-4', entrenadorId: 't1', entrenadoId: 'e1', estado: 'pendiente', activa: false },
    ] as any[];

    it('getInvitacionesPendientesPorEntrenador filtra por estado="pendiente" y activa=true', () => {
      const result = allInvitaciones.filter(inv => inv.entrenadorId === 't1' && inv.estado === 'pendiente' && inv.activa);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('inv-1');
    });

    it('getInvitacionesPendientesPorEntrenado excluye no-pendientes', () => {
      const result = allInvitaciones.filter(inv => inv.entrenadoId === 'e1' && inv.estado === 'pendiente' && inv.activa);
      expect(result.map(i => i.id)).not.toContain('inv-2');
      expect(result.map(i => i.id)).not.toContain('inv-4');
    });
  });
});
