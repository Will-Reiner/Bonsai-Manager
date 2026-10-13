import { chaveDoDia, ConteudoDoDia } from './conteudo';
import { podeApagarComentario } from './interacoes';
import { mostraCuidados } from './visibilidade';
import type {
  AutorDTO,
  ComentarioDTO,
  ComentarioLido,
  DiaPublicoDTO,
  InteracoesDoPost,
  NotificacaoDTO,
  NotificacaoLida,
  PlantaDTO,
  PlantaLidaBase,
  PostDTO,
  PostLido,
} from '../comunidade.types';

/** Coluna DATE (meia-noite UTC) → "AAAA-MM-DD". */
export const paraDia = (data: Date) => data.toISOString().slice(0, 10);

export const autorDe = (u: { id: string; nome: string; nomePublico: string | null; fotoPerfilUrl: string | null }): AutorDTO => ({
  id: u.id,
  nome: u.nomePublico || u.nome,
  fotoPerfilUrl: u.fotoPerfilUrl,
});

export const plantaDe = (p: PlantaLidaBase): PlantaDTO => ({
  id: p.id,
  identificador: p.identificador,
  nome: p.nome,
  fotoCapaUrl: p.fotoCapaUrl,
  especie: p.especie,
});

/** Posts prontos para o app; dia que ficou sem foto (corrida com uma exclusão) não vira card vazio. */
export function montarPosts(
  posts: PostLido[],
  conteudo: Map<string, ConteudoDoDia>,
  viewerId: string,
  interacoes: Map<string, InteracoesDoPost> = new Map(),
): PostDTO[] {
  return posts.flatMap((p) => {
    const dia = paraDia(p.dia);
    const i = interacoes.get(p.id);
    const doDia = conteudo.get(chaveDoDia(p.plantaId, dia));
    if (!doDia?.fotos.length) return [];
    return [
      {
        id: p.id,
        dia,
        publicadoEm: p.publicadoEm,
        autor: autorDe(p.usuario),
        planta: plantaDe(p.planta),
        fotos: doDia.fotos,
        cuidados: mostraCuidados(p.usuario, viewerId) ? doDia.cuidados : null,
        curtidas: i?.curtidas ?? 0,
        curtiu: i?.curtiu ?? false,
        salvou: i?.salvou ?? false,
        totalComentarios: i?.comentarios ?? 0,
      },
    ];
  });
}

/** Página pública da planta: dias com foto (e, com histórico público, dias só de cuidado), mais novo primeiro. */
export function linhaDoTempoPublica(
  plantaId: string,
  posts: { id: string; dia: Date }[],
  conteudo: Map<string, ConteudoDoDia>,
  comCuidados: boolean,
): DiaPublicoDTO[] {
  const postDoDia = new Map(posts.map((p) => [paraDia(p.dia), p.id]));
  const prefixo = chaveDoDia(plantaId, '');
  return [...conteudo.entries()]
    .filter(([chave]) => chave.startsWith(prefixo))
    .flatMap(([chave, c]) => {
      const dia = chave.slice(prefixo.length);
      const temFotos = c.fotos.length > 0;
      if (!temFotos && !(comCuidados && c.cuidados.length)) return [];
      return [{ dia, postId: temFotos ? postDoDia.get(dia) ?? null : null, fotos: c.fotos, cuidados: comCuidados ? c.cuidados : null }];
    })
    .sort((a, b) => b.dia.localeCompare(a.dia));
}


export const comentarioDe = (c: ComentarioLido, viewerId: string): ComentarioDTO => ({
  id: c.id,
  texto: c.texto,
  createdAt: c.createdAt,
  autor: autorDe(c.usuario),
  podeApagar: podeApagarComentario(c.usuario.id, c.post.usuarioId, viewerId),
});

export const notificacaoDe = (n: NotificacaoLida): NotificacaoDTO => ({
  id: n.id,
  tipo: n.tipo,
  lida: n.lida,
  createdAt: n.createdAt,
  ator: autorDe(n.ator),
  post: n.post ? { id: n.post.id, plantaId: n.post.planta.id, capa: n.post.planta.fotoCapaUrl } : null,
  comentario: n.comentario?.texto ?? null,
});
