import { uuidv4 } from './uuid';

describe('uuidv4', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('devuelve una cadena con formato UUID v4 válido', () => {
    const id = uuidv4();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('tiene exactamente 36 caracteres', () => {
    expect(uuidv4().length).toBe(36);
  });

  it('contiene exactamente 4 guiones en las posiciones correctas', () => {
    const id = uuidv4();
    expect(id[8]).toBe('-');
    expect(id[13]).toBe('-');
    expect(id[18]).toBe('-');
    expect(id[23]).toBe('-');
  });

  it('el tercer grupo siempre empieza con "4" (versión UUID 4)', () => {
    for (let i = 0; i < 20; i++) {
      const id = uuidv4();
      expect(id[14]).toBe('4');
    }
  });

  it('el cuarto grupo siempre empieza con 8, 9, a o b (variante RFC 4122)', () => {
    for (let i = 0; i < 20; i++) {
      const id = uuidv4();
      expect(['8', '9', 'a', 'b']).toContain(id[19].toLowerCase());
    }
  });

  it('genera IDs únicos en múltiples invocaciones', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(uuidv4());
    }
    // Si todos son únicos, el set tendrá 1000 elementos
    expect(ids.size).toBe(1000);
  });

  it('devuelve solo caracteres hexadecimales y guiones', () => {
    const id = uuidv4();
    expect(id).toMatch(/^[0-9a-f-]+$/i);
  });
});
