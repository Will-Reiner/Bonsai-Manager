export interface PresignedUrlRequestDTO {
  fileName: string;
  fileType: string;
}

export interface PresignedUrlResponseDTO {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}
