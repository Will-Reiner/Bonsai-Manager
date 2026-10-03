import { midiaApi } from './endpoints';

const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

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
