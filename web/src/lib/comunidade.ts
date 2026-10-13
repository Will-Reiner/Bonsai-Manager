import { toDateInput } from '@/lib/format';
import type { AutorComunidade, Planta, PostComunidade } from '@/types';

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
