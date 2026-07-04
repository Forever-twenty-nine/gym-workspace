import { FormatFechaPipe } from './format-fecha.pipe';

describe('FormatFechaPipe', () => {
  let pipe: FormatFechaPipe;

  beforeEach(() => {
    pipe = new FormatFechaPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string if no date is provided', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should transform a standard Date object to local string', () => {
    const date = new Date(2026, 6, 4); // July 4, 2026
    const result = pipe.transform(date);
    expect(result).toBe('04/07/2026'); // Using default 'es-ES' locale
  });

  it('should handle Firestore Timestamp-like objects with a toDate method', () => {
    const mockTimestamp = {
      toDate: () => new Date(2026, 6, 4)
    };
    const result = pipe.transform(mockTimestamp);
    expect(result).toBe('04/07/2026');
  });

  it('should allow custom options', () => {
    const date = new Date(2026, 6, 4);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const result = pipe.transform(date, options);
    // Locale is 'es-ES'
    expect(result).toBe('4 de julio de 2026');
  });
});
