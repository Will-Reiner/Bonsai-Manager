import { prisma } from '../../../lib/prisma';
import { MidiaReferenciaRepository } from '../midia.types';

/** Campos do banco que guardam URLs do R2. */
export class PrismaMidiaReferenciaRepository implements MidiaReferenciaRepository {
  async urlsEmUso(urls: string[]): Promise<string[]> {
    const [fotos, thumbs, capas, perfis] = await Promise.all([
      prisma.foto.findMany({ where: { caminhoArquivo: { in: urls } }, select: { caminhoArquivo: true } }),
      prisma.foto.findMany({ where: { thumbnailUrl: { in: urls } }, select: { thumbnailUrl: true } }),
      prisma.planta.findMany({ where: { fotoCapaUrl: { in: urls } }, select: { fotoCapaUrl: true } }),
      prisma.usuario.findMany({ where: { fotoPerfilUrl: { in: urls } }, select: { fotoPerfilUrl: true } }),
    ]);

    return [
      ...fotos.map((f) => f.caminhoArquivo),
      ...thumbs.map((f) => f.thumbnailUrl),
      ...capas.map((p) => p.fotoCapaUrl),
      ...perfis.map((u) => u.fotoPerfilUrl),
    ].filter((u): u is string => !!u);
  }
}
