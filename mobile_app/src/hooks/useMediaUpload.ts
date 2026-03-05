import { useState, useCallback } from 'react';
import { compressImage, compressVideo, generateVideoThumbnail } from '../utils/mediaCompressor';
import { getPresignedUrl, uploadToR2 } from '../services/mediaService';

export interface MediaUploadResult {
  publicUrl: string;
  thumbnailUrl?: string;
  tipo: 'foto' | 'video';
}

type Phase = 'idle' | 'comprimindo' | 'enviando';

export interface UseMediaUploadReturn {
  upload: (fileUri: string, mimeType: string) => Promise<MediaUploadResult>;
  thumbnailUri: string | null;
  isUploading: boolean;
  progress: number;
  phase: Phase;
  error: string | null;
  reset: () => void;
}

export function useMediaUpload(): UseMediaUploadReturn {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setThumbnailUri(null);
    setIsUploading(false);
    setProgress(0);
    setPhase('idle');
    setError(null);
  }, []);

  const upload = useCallback(async (fileUri: string, mimeType: string): Promise<MediaUploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (mimeType.startsWith('image/')) {
        setPhase('comprimindo');
        setProgress(0);

        const compressed = await compressImage(fileUri);

        setProgress(30);
        setPhase('enviando');

        const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'image/webp');
        await uploadToR2(uploadUrl, compressed.uri, 'image/webp', (p) => {
          setProgress(30 + p * 0.7);
        });

        setProgress(100);
        return { publicUrl, tipo: 'foto' };
      } else {
        // Vídeo
        setPhase('comprimindo');
        setProgress(0);

        // Gera thumbnail (UI otimista - disponível logo após ~2s)
        const thumbUri = await generateVideoThumbnail(fileUri);
        setThumbnailUri(thumbUri);

        // Upload da thumbnail em paralelo (0–5%)
        let thumbnailPublicUrl = '';
        const thumbFileName = `thumb_${Date.now()}.webp`;
        const thumbPresigned = await getPresignedUrl(thumbFileName, 'image/webp');
        thumbnailPublicUrl = thumbPresigned.publicUrl;
        await uploadToR2(thumbPresigned.uploadUrl, thumbUri, 'image/webp', (p) => {
          setProgress(p * 0.05);
        });

        // Comprime o vídeo (5–65%)
        const compressed = await compressVideo(fileUri, (p) => {
          setProgress(5 + p * 0.60);
        });

        setPhase('enviando');
        setProgress(65);

        const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'video/mp4');
        await uploadToR2(uploadUrl, compressed.uri, 'video/mp4', (p) => {
          setProgress(65 + p * 0.35);
        });

        setProgress(100);
        return { publicUrl, thumbnailUrl: thumbnailPublicUrl, tipo: 'video' };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao enviar mídia.';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
      setPhase('idle');
    }
  }, []);

  return { upload, thumbnailUri, isUploading, progress, phase, error, reset };
}
