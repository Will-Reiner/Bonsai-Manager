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
  const condicoes: Prisma.PostWhereInput[] = [visivelPara(viewerId)];
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


/** Busca de pessoas: só perfis públicos e só pelo nome público (o nome cadastrado não liga um pseudônimo ao nome real). */
export function filtroDaBusca(q: string): Prisma.UsuarioWhereInput {
  return { perfilPublico: true, nomePublico: { contains: q, mode: 'insensitive' } };
}


/** Post visível ao leitor: meu, ou de perfil e planta públicos. */
export function visivelPara(viewerId: string): Prisma.PostWhereInput {
  return { OR: [{ usuarioId: viewerId }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] };
}

/** Comentários do post em ordem crescente (createdAt, id): depois do cursor = mais novos. */
export function filtroDosComentarios(postId: string, cursor?: string): Prisma.ComentarioWhereInput {
  if (!cursor) return { postId };
  const c = lerCursor(cursor);
  return { postId, OR: [{ createdAt: { gt: c.data } }, { createdAt: c.data, id: { gt: c.id } }] };
}

/** Meus salvos de posts ainda visíveis, do mais recente salvo (createdAt, postId desc). */
export function filtroDosSalvos(viewerId: string, cursor?: string): Prisma.SalvoWhereInput {
  const base: Prisma.SalvoWhereInput = { usuarioId: viewerId, post: visivelPara(viewerId) };
  if (!cursor) return base;
  const c = lerCursor(cursor);
  return { ...base, OR: [{ createdAt: { lt: c.data } }, { createdAt: c.data, postId: { lt: c.id } }] };
}

/** Minhas notificações, das mais novas (createdAt, id desc). */
export function filtroDasNotificacoes(usuarioId: string, cursor?: string): Prisma.NotificacaoWhereInput {
  if (!cursor) return { usuarioId };
  const c = lerCursor(cursor);
  return { usuarioId, OR: [{ createdAt: { lt: c.data } }, { createdAt: c.data, id: { lt: c.id } }] };
}
