import type { Prisma } from '@prisma/client';
import type { AbaFeed, Janela } from '../comunidade.types';

/** Posição do último item de uma página, na ordem (data desc, id desc). */
export interface Cursor {
  data: Date;
  id: string;
}

const SEPARADOR = '_';

/** "ISO_id" — guarda a posição, não o item: continua válido se o item sumir ou ficar invisível. */
export const codificarCursor = (data: Date, id: string) => `${data.toISOString()}${SEPARADOR}${id}`;

export function lerCursor(texto: string): Cursor {
  const i = texto.indexOf(SEPARADOR);
  const data = new Date(texto.slice(0, i));
  const id = texto.slice(i + 1);
  if (i < 0 || Number.isNaN(data.getTime()) || !id) throw new Error('Página inválida.');
  return { data, id };
}

/** Itens depois do cursor na ordem (campo desc, id desc). */
function depoisDoCursor(campo: 'publicadoEm' | 'dia', c: Cursor): Prisma.PostWhereInput {
  return campo === 'dia'
    ? { OR: [{ dia: { lt: c.data } }, { dia: c.data, id: { lt: c.id } }] }
    : { OR: [{ publicadoEm: { lt: c.data } }, { publicadoEm: c.data, id: { lt: c.id } }] };
}

/** Onde do feed: só posts no feed e visíveis ao leitor; em Seguindo, só meus e de quem eu sigo. */
export function filtroDoFeed(viewerId: string, aba: AbaFeed, cursor?: string): Prisma.PostWhereInput {
  const condicoes: Prisma.PostWhereInput[] = [
    { OR: [{ usuarioId: viewerId }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] },
  ];
  if (aba === 'seguindo') {
    condicoes.push({ OR: [{ usuarioId: viewerId }, { usuario: { seguidores: { some: { seguidorId: viewerId } } } }] });
  }
  if (cursor) condicoes.push(depoisDoCursor('publicadoEm', lerCursor(cursor)));
  return { noFeed: false, AND: condicoes };
}

/** Posts das plantas públicas do usuário (inclui os fora do feed), por dia desc. */
export function filtroDosPostsDoUsuario(usuarioId: string, cursor?: string): Prisma.PostWhereInput {
  return {
    usuarioId,
    planta: { plantaPublica: true },
    ...(cursor ? { AND: [depoisDoCursor('dia', lerCursor(cursor))] } : {}),
  };
}


const DIA_MS = 86_400_000;

/** Dias da página com folga: o dia local de São Paulo vai de dia 03h a dia+1 03h (UTC). */
export function janelaDosPosts(posts: { dia: Date }[]): Janela {
  const tempos = posts.map((p) => p.dia.getTime());
  return { de: new Date(Math.min(...tempos) - DIA_MS), ate: new Date(Math.max(...tempos) + 2 * DIA_MS) };
}

/** Onde de fotos e cuidados na janela; o dia exato continua sendo decidido em `conteudoPorDia`. */
export function filtrosDaJanela({ de, ate }: Janela): { fotos: Prisma.FotoWhereInput; cuidados: Prisma.AgendaWhereInput } {
  const dentro = { gte: de, lt: ate };
  const peloCuidado = { OR: [{ dataConcluida: dentro }, { dataConcluida: null, dataAgendada: dentro }] };
  return {
    fotos: { OR: [{ dataCaptura: dentro }, { dataCaptura: null, createdAt: dentro }, { agenda: { status: 'CONCLUIDO', ...peloCuidado } }] },
    cuidados: peloCuidado,
  };
}
