// Funções puras de resolução de data de captura.
// IMPORTANTE: não importar react-native/expo aqui (rodam no jest mínimo).

/**
 * Converte o EXIF DateTimeOriginal ("YYYY:MM:DD HH:MM:SS") em Date local.
 * Retorna null se ausente ou em formato inesperado.
 */
export function parseExifDateTimeOriginal(value?: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return isNaN(date.getTime()) ? null : date;
}

export interface ResolveCaptureDateInput {
  creationTimeMs?: number | null;
  exif?: Record<string, any> | null;
}

/**
 * Decide a data de captura: prioriza o creationTime do MediaLibrary (foto e vídeo),
 * com fallback para o EXIF DateTimeOriginal. Retorna null se nada for confiável.
 */
export function resolveCaptureDate(input: ResolveCaptureDateInput): Date | null {
  const { creationTimeMs, exif } = input;
  if (typeof creationTimeMs === 'number' && creationTimeMs > 0) {
    const d = new Date(creationTimeMs);
    if (!isNaN(d.getTime())) return d;
  }
  const exifValue: string | null =
    exif?.DateTimeOriginal ?? exif?.['{Exif}']?.DateTimeOriginal ?? null;
  return parseExifDateTimeOriginal(exifValue);
}
