import api from '../api';

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function getPresignedUrl(
  fileName: string,
  fileType: string,
): Promise<PresignedUrlResponse> {
  const response = await api.post('/midia/presigned-url', { fileName, fileType });
  return response.data;
}

export function uploadToR2(
  uploadUrl: string,
  fileUri: string,
  mimeType: string,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        console.error(`[uploadToR2] status=${xhr.status} body=${xhr.responseText}`);
        reject(new Error(`Upload falhou com status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede durante o upload.'));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);

    fetch(fileUri)
      .then((r) => r.blob())
      .then((blob) => xhr.send(blob))
      .catch(reject);
  });
}
