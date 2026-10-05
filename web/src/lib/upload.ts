import { midiaApi } from './endpoints';

const MAX_DIMENSION = 1600;

/**
 * Máximo de fotos escolhidas de uma vez (cadastro de planta, fotos em lote): todas ficam em memória até o
 * envio — o Safari iOS derruba a aba com muitas imagens — e o trabalho se perde se a aba fechar.
 */
export const MAX_FOTOS_POR_VEZ = 50;
const QUALITY = 0.82;

const dataValida = (d: Date) => !Number.isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getTime() <= Date.now() + 86_400_000;

/**
 * Data no nome do arquivo, padrão das câmeras/apps: PXL_20240315_102030123.jpg, IMG_20240315_102030.jpg,
 * Screenshot_2024-03-15-10-20-30.png, IMG-20240315-WA0001.jpg (só data → meio-dia local).
 */
export function dataDoNome(nome: string): Date | null {
  const completa = nome.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})[-_ T]?(\d{2})[-_.:h]?(\d{2})[-_.:m]?(\d{2})/);
  const soData = completa ?? nome.match(/(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})(?!\d)/);
  if (!soData) return null;
  const [ano, mes, dia, h = '12', min = '0', s = '0'] = soData.slice(1);
  const d = new Date(+ano, +mes - 1, +dia, +h, +min, +s);
  // rejeita overflow (ex.: mês 13) que o Date normalizaria silenciosamente
  if (d.getMonth() !== +mes - 1 || d.getDate() !== +dia || d.getHours() !== +h) return null;
  return dataValida(d) ? d : null;
}

export type OrigemData = 'exif' | 'nome' | 'arquivo';

/**
 * Data em que a foto foi tirada: EXIF DateTimeOriginal (lido do arquivo original — a compressão via canvas
 * descarta o EXIF) → data no nome do arquivo → `lastModified`. O seletor de fotos do Android/Google Fotos
 * costuma entregar cópias sem EXIF e com `lastModified` = hoje, por isso o nome vem antes.
 */
export async function dataCapturaDe(file: File): Promise<{ data: string; origem: OrigemData }> {
  try {
    const { default: exifr } = await import('exifr');
    const exif = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate', 'ModifyDate']);
    const data = exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate;
    if (data instanceof Date && dataValida(data)) return { data: data.toISOString(), origem: 'exif' };
  } catch {
    // sem EXIF ou formato não suportado — tenta os fallbacks
  }
  const doNome = dataDoNome(file.name);
  if (doNome) return { data: doNome.toISOString(), origem: 'nome' };
  return { data: new Date(file.lastModified || Date.now()).toISOString(), origem: 'arquivo' };
}

/** Redimensiona a imagem no navegador (lado maior ≤ 1600px) e converte para WebP/JPEG. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // formato que o navegador não decodifica (ex.: HEIC em alguns browsers) — envia o original
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  let blob = await toBlob('image/webp');
  let type = 'image/webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob('image/jpeg');
    type = 'image/jpeg';
  }
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${baseName}.${type === 'image/webp' ? 'webp' : 'jpg'}`, {
    type,
    lastModified: file.lastModified,
  });
}

function putWithProgress(url: string, file: File, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Falha no upload (status ${xhr.status}).`));
    xhr.onerror = () =>
      reject(new Error('Erro de rede no upload. Verifique a regra de CORS do bucket R2.'));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/** Comprime, pede uma URL pré-assinada à API e envia direto ao R2. Retorna a URL pública. */
export async function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const compressed = await compressImage(file);
  const { uploadUrl, publicUrl } = await midiaApi.presign(compressed.name, compressed.type);
  await putWithProgress(uploadUrl, compressed, onProgress);
  return publicUrl;
}
