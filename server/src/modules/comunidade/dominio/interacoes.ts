import type { InteracoesDoPost } from '../comunidade.types';

/** Nunca avisa alguém da própria ação. */
export const deveNotificar = (atorId: string, destinatarioId: string) => atorId !== destinatarioId;

/** O autor apaga o seu comentário; o dono do post apaga qualquer um no post dele. */
export const podeApagarComentario = (autorId: string, donoDoPostId: string, viewerId: string) =>
  viewerId === autorId || viewerId === donoDoPostId;

/** Junta contagens e marcas do leitor por post (post sem nada fica zerado). */
export function interacoesPorPost(
  postIds: string[],
  lidas: {
    curtidas: { postId: string; total: number }[];
    comentarios: { postId: string; total: number }[];
    curtiu: string[];
    salvou: string[];
  },
): Map<string, InteracoesDoPost> {
  const total = (lista: { postId: string; total: number }[], id: string) => lista.find((x) => x.postId === id)?.total ?? 0;
  const curtiu = new Set(lidas.curtiu);
  const salvou = new Set(lidas.salvou);
  return new Map(
    postIds.map((id) => [
      id,
      { curtidas: total(lidas.curtidas, id), comentarios: total(lidas.comentarios, id), curtiu: curtiu.has(id), salvou: salvou.has(id) },
    ]),
  );
}
