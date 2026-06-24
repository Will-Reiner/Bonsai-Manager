import { parseExifDateTimeOriginal, resolveCaptureDate } from './mediaDate';

describe('parseExifDateTimeOriginal', () => {
  it('converte formato EXIF válido em Date', () => {
    const d = parseExifDateTimeOriginal('2024:03:15 10:30:00');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(2); // março = índice 2
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(10);
  });

  it('retorna null para ausência ou vazio', () => {
    expect(parseExifDateTimeOriginal(undefined)).toBeNull();
    expect(parseExifDateTimeOriginal('')).toBeNull();
  });

  it('retorna null para formato inválido', () => {
    expect(parseExifDateTimeOriginal('15/03/2024')).toBeNull();
  });
});

describe('resolveCaptureDate', () => {
  it('prioriza creationTimeMs do MediaLibrary sobre EXIF', () => {
    const ms = Date.UTC(2023, 0, 2, 12, 0, 0);
    const d = resolveCaptureDate({
      creationTimeMs: ms,
      exif: { DateTimeOriginal: '2024:03:15 10:30:00' },
    });
    expect(d!.getTime()).toBe(ms);
  });

  it('usa EXIF quando não há creationTime', () => {
    const d = resolveCaptureDate({
      creationTimeMs: null,
      exif: { DateTimeOriginal: '2024:03:15 10:30:00' },
    });
    expect(d!.getFullYear()).toBe(2024);
  });

  it('retorna null quando nada é confiável', () => {
    expect(resolveCaptureDate({ creationTimeMs: 0, exif: null })).toBeNull();
  });
});
