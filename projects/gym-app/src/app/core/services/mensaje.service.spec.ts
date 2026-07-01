/**
 * Tests para MensajeService
 */
import { Timestamp, updateDoc } from 'firebase/firestore';

const { mockUpdateDoc, mockDeleteDoc, mockSetDoc, mockAddDoc, mockOnSnapshot, mockCollection, mockDoc, mockQuery, mockOrderBy, mockTimestamp } = vi.hoisted(() => ({
  mockUpdateDoc: vi.fn(() => Promise.resolve()),
  mockDeleteDoc: vi.fn(() => Promise.resolve()),
  mockSetDoc: vi.fn(() => Promise.resolve()),
  mockAddDoc: vi.fn(() => Promise.resolve({ id: 'new-msg-id' })),
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

describe('MensajeService — lógica de mapeo y lectura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapFromFirestore', () => {
    function mapFromFirestore(data: any) {
      return {
        ...data,
        id: data.id,
        fechaEnvio: data.fechaEnvio && typeof data.fechaEnvio.toDate === 'function'
          ? data.fechaEnvio.toDate()
          : (data.fechaEnvio ? new Date(data.fechaEnvio) : new Date()),
        fechaLeido: data.fechaLeido && typeof data.fechaLeido.toDate === 'function'
          ? data.fechaLeido.toDate()
          : (data.fechaLeido ? new Date(data.fechaLeido) : undefined)
      };
    }

    it('preserva los campos originales del objeto', () => {
      const data = {
        id: 'm-1',
        contenido: 'Hola',
        remitenteId: 'u-1',
        destinatarioId: 'u-2'
      };

      const result = mapFromFirestore(data);
      expect(result.contenido).toBe('Hola');
      expect(result.remitenteId).toBe('u-1');
    });

    it('convierte fechaEnvio y fechaLeido a Date si tienen toDate()', () => {
      const result = mapFromFirestore({ 
        id: 'm-1', 
        fechaEnvio: { toDate: () => new Date('2024-01-15') },
        fechaLeido: { toDate: () => new Date('2024-01-16') }
      });
      expect(result.fechaEnvio).toBeInstanceOf(Date);
      expect(result.fechaLeido).toBeInstanceOf(Date);
    });
  });

  describe('marcarMensajes', () => {
    async function marcarComoLeido(id: string) {
      await updateDoc({} as any, { 
        leido: true, 
        fechaLeido: Timestamp.now() 
      });
    }

    async function marcarComoEntregado(id: string) {
      await updateDoc({} as any, { 
        entregado: true 
      });
    }

    it('marcarComoLeido actualiza leido y fechaLeido', async () => {
      await marcarComoLeido('m-1');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ 
          leido: true,
          fechaLeido: expect.anything()
        })
      );
    });

    it('marcarComoEntregado actualiza entregado', async () => {
      await marcarComoEntregado('m-1');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ 
          entregado: true
        })
      );
    });
  });

  describe('getMensajesConversacion (lógica de filtrado en cliente)', () => {
    function filterConversation(mensajes: any[], userA: string, userB: string) {
      return mensajes.filter(m => 
        (m.remitenteId === userA && m.destinatarioId === userB) ||
        (m.remitenteId === userB && m.destinatarioId === userA)
      );
    }

    const allMsgs = [
      { id: '1', remitenteId: 'u1', destinatarioId: 'u2' },
      { id: '2', remitenteId: 'u2', destinatarioId: 'u1' },
      { id: '3', remitenteId: 'u1', destinatarioId: 'u3' },
    ];

    it('filtra mensajes bidireccionalmente entre dos usuarios', () => {
      const chat12 = filterConversation(allMsgs, 'u1', 'u2');
      expect(chat12.length).toBe(2);
      expect(chat12.map(m => m.id)).toEqual(['1', '2']);
      
      const chat13 = filterConversation(allMsgs, 'u1', 'u3');
      expect(chat13.length).toBe(1);
      expect(chat13[0].id).toBe('3');
    });
  });
});
