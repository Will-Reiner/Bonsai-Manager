import { conteudoPorDia } from '../dominio/conteudo';
import { montarPosts } from '../dominio/montar';
import { codificarCursor, janelaDosPosts } from '../repositories/filtros';
import { podeVer } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PaginaDTO, PostDTO, PostLido } from '../comunidade.types';

export const LIMITE_PAGINA = 20;

/** Lê fotos e cuidados das plantas dos posts, só nos dias da página (uma vez para a página toda), e monta os DTOs. */
export async function carregarPosts(repo: LeituraComunidadeRepository, posts: PostLido[], viewerId: string): Promise<PostDTO[]> {
  if (!posts.length) return [];
  const { fotos, cuidados } = await repo.conteudo([...new Set(posts.map((p) => p.plantaId))], janelaDosPosts(posts));
  const interacoes = await repo.interacoes(posts.map((p) => p.id), viewerId);
  return montarPosts(posts, conteudoPorDia(fotos, cuidados), viewerId, interacoes);
}

/** Página cheia → há mais: o cursor é a posição (data da ordem + id) do último lido, mesmo que ele tenha saído da montagem. */
export function pagina<T>(itens: T[], lidos: PostLido[], ordem: 'publicadoEm' | 'dia'): PaginaDTO<T> {
  const ultimo = lidos[lidos.length - 1];
  return { itens, proximoCursor: lidos.length === LIMITE_PAGINA ? codificarCursor(ultimo[ordem], ultimo.id) : null };
}


/** O post, se o leitor pode vê-lo; senão 404 (não revela que existe). */
export async function postVisivel(repo: LeituraComunidadeRepository, viewerId: string, id: string): Promise<PostLido> {
  const post = await repo.post(id);
  if (!post || !podeVer(post.usuario, post.planta.plantaPublica, viewerId)) throw new NaoEncontrado('Post não encontrado.');
  return post;
}
