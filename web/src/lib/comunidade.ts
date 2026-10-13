import { toDateInput } from '@/lib/format';
import type { AutorComunidade, NotificacaoComunidade, Planta, PostComunidade } from '@/types';

export type ModoPlantas = 'todas' | 'selecionadas';

/** "Todas" não é guardado: é quando toda planta do usuário é pública. Sem a lista (carregando/erro), não há modo. */
export function modoPlantas(plantas: Pick<Planta, 'plantaPublica'>[] | undefined): ModoPlantas | null {
  if (!plantas) return null;
  return plantas.every((p) => p.plantaPublica) ? 'todas' : 'selecionadas';
}


export type ItemFeed =
  | { tipo: 'post'; post: PostComunidade }
  | { tipo: 'grupo'; chave: string; autor: AutorComunidade; posts: PostComunidade[] };

/** A partir de quantos posts seguidos da mesma pessoa no mesmo dia o feed junta num cartão. */
export const MINIMO_PARA_AGRUPAR = 3;

/** Junta 3+ posts seguidos da mesma pessoa no mesmo dia (de publicação, fuso do aparelho) num cartão só. */
export function agruparFeed(posts: PostComunidade[]): ItemFeed[] {
  const itens: ItemFeed[] = [];
  for (let i = 0; i < posts.length; ) {
    const primeiro = posts[i];
    const dia = toDateInput(primeiro.publicadoEm);
    let fim = i + 1;
    while (fim < posts.length && posts[fim].autor.id === primeiro.autor.id && toDateInput(posts[fim].publicadoEm) === dia) fim++;
    const sequencia = posts.slice(i, fim);
    if (sequencia.length >= MINIMO_PARA_AGRUPAR) itens.push({ tipo: 'grupo', chave: primeiro.id, autor: primeiro.autor, posts: sequencia });
    else itens.push(...sequencia.map((post) => ({ tipo: 'post' as const, post })));
    i = fim;
  }
  return itens;
}

/** Imagem que representa o post em grades e miniaturas (vídeo usa a miniatura dele). */
export function capaDoPost(post: PostComunidade): string | null {
  const f = post.fotos[0];
  if (!f) return null;
  return f.tipo === 'VIDEO' ? f.thumbnailUrl : f.url;
}


/** Curtir/descurtir no cartão antes da resposta do servidor (nunca negativo; repetir não muda). */
export function alternarCurtida(e: { curtiu: boolean; curtidas: number }, curtir: boolean) {
  if (e.curtiu === curtir) return { curtiu: e.curtiu, curtidas: e.curtidas };
  return { curtiu: curtir, curtidas: Math.max(0, e.curtidas + (curtir ? 1 : -1)) };
}

export const rotuloCurtidas = (n: number) => (n === 1 ? '1 curtida' : `${n} curtidas`);
export const rotuloComentarios = (n: number) => (n === 1 ? 'ver 1 comentário' : `ver os ${n} comentários`);

const TRECHO = 60;

export function textoDaNotificacao(n: NotificacaoComunidade): string {
  if (n.tipo === 'CURTIDA') return 'curtiu seu post';
  if (n.tipo === 'SEGUIU') return 'começou a seguir você';
  const c = n.comentario ?? '';
  return `comentou: “${c.length > TRECHO ? `${c.slice(0, TRECHO - 1)}…` : c}”`;
}

export function linkDaNotificacao(n: NotificacaoComunidade): string {
  if (!n.post) return `/comunidade/u/${n.ator.id}`;
  return `/comunidade/post/${n.post.id}${n.tipo === 'COMENTARIO' ? '#comentarios' : ''}`;
}

/** Chave do cartão: muda quando curtidas/salvo vindos do servidor mudam, para o estado local recomeçar deles. */
export const chaveDoPost = (p: PostComunidade) => `${p.id}|${p.curtiu}|${p.curtidas}|${p.salvou}|${p.totalComentarios}`;
