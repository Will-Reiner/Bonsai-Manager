import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { resolveCaptureDate } from './mediaDate';

/**
 * Tenta descobrir a data real de captura de uma mídia escolhida no picker.
 * Prioriza o creationTime do MediaLibrary (foto e vídeo); cai para o EXIF; senão null.
 */
export async function extractCaptureDate(asset: ImagePicker.ImagePickerAsset): Promise<Date | null> {
  let creationTimeMs: number | null = null;
  try {
    if (asset.assetId) {
      const perm = await MediaLibrary.getPermissionsAsync();
      const granted = perm.granted || (await MediaLibrary.requestPermissionsAsync()).granted;
      if (granted) {
        const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
        creationTimeMs = info?.creationTime ?? null;
      }
    }
  } catch {
    creationTimeMs = null;
  }
  return resolveCaptureDate({ creationTimeMs, exif: (asset as any).exif ?? null });
}
