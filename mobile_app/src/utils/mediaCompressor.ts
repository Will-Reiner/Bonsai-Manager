import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video as NativeVideo } from 'react-native-compressor';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CompressedImage {
  uri: string;
  mimeType: 'image/webp';
  fileName: string;
}

export interface CompressedVideo {
  uri: string;
  mimeType: 'video/mp4';
  fileName: string;
}

export async function compressImage(uri: string): Promise<CompressedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP },
  );

  return {
    uri: result.uri,
    mimeType: 'image/webp',
    fileName: `${generateUUID()}.webp`,
  };
}

export async function compressVideo(
  uri: string,
  onProgress: (progress: number) => void,
): Promise<CompressedVideo> {
  const metadata = await NativeVideo.getVideoMetaData(uri);

  if (metadata.duration > 60) {
    throw new Error('O vídeo não pode ter mais de 60 segundos.');
  }

  const compressedUri = await NativeVideo.compress(
    uri,
    {
      maxSize: 1280,
      compressionMethod: 'manual',
      bitrate: 2_000_000,
    },
    onProgress,
  );

  return {
    uri: compressedUri,
    mimeType: 'video/mp4',
    fileName: `${generateUUID()}.mp4`,
  };
}

export async function generateVideoThumbnail(uri: string): Promise<string> {
  const thumbnail = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 });
  const compressed = await compressImage(thumbnail.uri);
  return compressed.uri;
}
