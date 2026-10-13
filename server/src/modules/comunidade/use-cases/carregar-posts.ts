import { conteudoPorDia } from '../dominio/conteudo';
import { montarPosts } from '../dominio/montar';
import type { LeituraComunidadeRepository, PaginaDTO, PostDTO, PostLido } from '../comunidade.types';

export const LIMITE_PAGINA = 20;

/** Lê fotos e cuidados das plantas dos posts (uma vez para a página toda) e monta os DTOs. */
export async function carregarPosts(repo: LeituraComunidadeRepository, posts: PostLido[], viewerId: string): Promise<PostDTO[]> {
  if (!posts.length) return [];
  const { fotos, cuidados } = await repo.conteudo([...new Set(posts.map((p) => p.plantaId))]);
  return montarPosts(posts, conteudoPorDia(fotos, cuidados), viewerId);
}

/** Página cheia → há mais: o cursor é o id do último lido (mesmo que ele tenha saído da montagem). */
export const pagina = <T>(itens: T[], lidos: { id: string }[]): PaginaDTO<T> => ({
  itens,
  proximoCursor: lidos.length === LIMITE_PAGINA ? lidos[lidos.length - 1].id : null,
});
