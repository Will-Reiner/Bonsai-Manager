export interface PresignedUrlRequestDTO {
  fileName: string;
  fileType: string;
}

export interface PresignedUrlResponseDTO {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/** Armazenamento de arquivos (R2). */
export interface MidiaStorage {
  /** Remove os arquivos pelas URLs públicas; URLs de fora do bucket são ignoradas. */
  removerPorUrls(urls: string[]): Promise<void>;
}

export interface MidiaReferenciaRepository {
  /** Dentre as URLs informadas, as que ainda são usadas por algum registro (foto, capa, perfil). */
  urlsEmUso(urls: string[]): Promise<string[]>;
}

/** Remove do storage as mídias que não são mais referenciadas. Nunca lança erro. */
export interface LimpezaDeMidia {
  execute(urls: (string | null | undefined)[]): Promise<void>;
}
