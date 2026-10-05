import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { MidiaStorage } from '../midia.types';

/** Limite de chaves por chamada do DeleteObjects. */
const LOTE = 1000;

export class R2MidiaStorage implements MidiaStorage {
  constructor(
    private s3Client: S3Client,
    private bucket: string,
    private publicUrl: string,
  ) {}

  /** `${publicUrl}/media/x/foto.webp` → `media/x/foto.webp`; null se a URL não é do bucket. */
  private chaveDe(url: string): string | null {
    const prefixo = `${this.publicUrl}/`;
    if (!this.publicUrl || !url.startsWith(prefixo)) return null;
    return decodeURIComponent(url.slice(prefixo.length));
  }

  async removerPorUrls(urls: string[]): Promise<void> {
    const chaves = urls.map((u) => this.chaveDe(u)).filter((k): k is string => !!k);

    for (let i = 0; i < chaves.length; i += LOTE) {
      const lote = chaves.slice(i, i + LOTE);
      const resposta = await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: lote.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      if (resposta.Errors?.length) {
        const detalhes = resposta.Errors.map((e) => `${e.Key} (${e.Code})`).join(', ');
        throw new Error(`Falha ao remover do R2: ${detalhes}`);
      }
    }
  }
}
