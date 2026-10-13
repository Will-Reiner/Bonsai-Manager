import type { Prisma } from '@prisma/client';
import type { AbaFeed } from '../comunidade.types';

/** Onde do feed: só posts no feed e visíveis ao leitor; em Seguindo, só meus e de quem eu sigo. */
export function filtroDoFeed(viewerId: string, aba: AbaFeed): Prisma.PostWhereInput {
  const condicoes: Prisma.PostWhereInput[] = [
    { OR: [{ usuarioId: viewerId }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] },
  ];
  if (aba === 'seguindo') {
    condicoes.push({ OR: [{ usuarioId: viewerId }, { usuario: { seguidores: { some: { seguidorId: viewerId } } } }] });
  }
  return { noFeed: false, AND: condicoes };
}
