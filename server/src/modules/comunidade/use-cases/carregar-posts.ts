import { conteudoPorDia } from '../dominio/conteudo';
import { montarPosts } from '../dominio/montar';
import { codificarCursor } from '../repositories/filtros';
import type { LeituraComunidadeRepository, PaginaDTO, PostDTO, PostLido } from '../comunidade.types';

export const LIMITE_PAGINA = 20;

/** Lê fotos e cuidados das plantas dos posts (uma vez para a página toda) e monta os DTOs. */
export async function carregarPosts(repo: LeituraComunidadeRepository, posts: PostLido[], viewerId: string): Promise<PostDTO[]> {
  if (!posts.length) return [];
  const { fotos, cuidados } = await repo.conteudo([...new Set(posts.map((p) => p.plantaId))]);
  return montarPosts(posts, conteudoPorDia(fotos, cuidados), viewerId);
}

/** Página cheia → há mais: o cursor é a posição (data da ordem + id) do último lido, mesmo que ele tenha saído da montagem. */
export function pagina<T>(itens: T[], lidos: PostLido[], ordem: 'publicadoEm' | 'dia'): PaginaDTO<T> {
  const ultimo = lidos[lidos.length - 1];
  return { itens, proximoCursor: lidos.length === LIMITE_PAGINA ? codificarCursor(ultimo[ordem], ultimo.id) : null };
}
