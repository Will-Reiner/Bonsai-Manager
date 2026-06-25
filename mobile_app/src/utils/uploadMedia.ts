import { compressImage, compressVideo, generateVideoThumbnail } from './mediaCompressor';
import { getPresignedUrl, uploadToR2 } from '../services/mediaService';

export interface ProcessedMedia {
  publicUrl: string;
  thumbnailUrl?: string;
  tipo: 'FOTO' | 'VIDEO';
}

/**
 * Comprime e envia uma mídia ao R2. `onProgress` recebe 0–100.
 * Espelha a lógica de useMediaUpload, mas como função pura de orquestração
 * para uso em uploads múltiplos (galeria de memória).
 */
export async function processAndUploadMedia(
  fileUri: string,
  mimeType: string,
  onProgress: (percent: number) => void,
): Promise<ProcessedMedia> {
  if (mimeType.startsWith('image/')) {
    onProgress(0);
    const compressed = await compressImage(fileUri);
    onProgress(30);
    const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'image/webp');
    await uploadToR2(uploadUrl, compressed.uri, 'image/webp', (p) => onProgress(30 + p * 0.7));
    onProgress(100);
    return { publicUrl, tipo: 'FOTO' };
  }

  // Vídeo
  onProgress(0);
  const thumbUri = await generateVideoThumbnail(fileUri);
  const thumbFileName = `thumb_${Date.now()}.webp`;
  const thumbPresigned = await getPresignedUrl(thumbFileName, 'image/webp');
  await uploadToR2(thumbPresigned.uploadUrl, thumbUri, 'image/webp', (p) => onProgress(p * 0.05));

  const compressed = await compressVideo(fileUri, (p) => onProgress(5 + p * 0.6));
  const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'video/mp4');
  await uploadToR2(uploadUrl, compressed.uri, 'video/mp4', (p) => onProgress(65 + p * 0.35));
  onProgress(100);

  return { publicUrl, thumbnailUrl: thumbPresigned.publicUrl, tipo: 'VIDEO' };
}
