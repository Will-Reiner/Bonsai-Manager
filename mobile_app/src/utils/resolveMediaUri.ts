import { SERVER_URL } from '../api';

/**
 * Resolve URI de mídia: URLs R2 (Cloudflare) são absolutas;
 * caminhos antigos são relativos ao servidor.
 */
export const resolveMediaUri = (caminhoArquivo: string): string => {
  if (caminhoArquivo.startsWith('http')) return caminhoArquivo;
  return `${SERVER_URL}${caminhoArquivo}`;
};
