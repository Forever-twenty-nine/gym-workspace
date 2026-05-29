import { uuidv4 } from './uuid';

describe('uuidv4', () => {
  it('returns a valid uuid v4 string', () => {
    const id = uuidv4();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(id.length).toBe(36);
  });
});
