import { prisma } from '../../../lib/prisma';
import { filtroDaBusca, filtroDasNotificacoes, filtroDoFeed, filtroDosComentarios, filtroDosPostsDoUsuario, filtroDosSalvos, filtrosDaJanela } from './filtros';
import { interacoesPorPost } from '../dominio/interacoes';
import type { AbaFeed, Janela, LeituraComunidadeRepository } from '../comunidade.types';

const usuarioLido = { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true, perfilPublico: true, historicoPublico: true } as const;
const plantaLida = {
  id: true,
  identificador: true,
  nome: true,
  fotoCapaUrl: true,
  plantaPublica: true,
  especie: { select: { nomeComum: true, nomeCientifico: true } },
} as const;
const comentarioLido = { id: true, texto: true, createdAt: true, usuario: { select: usuarioLido }, post: { select: { usuarioId: true } } } as const;
const postLido = { id: true, dia: true, publicadoEm: true, plantaId: true, usuario: { select: usuarioLido }, planta: { select: plantaLida } } as const;

export class PrismaLeituraComunidadeRepository implements LeituraComunidadeRepository {
  feed(viewerId: string, aba: AbaFeed, cursor: string | undefined, limite: number) {
    return prisma.post.findMany({
      // Página pela posição do cursor (data + id), não pelo item: não pula nada se ele sumir ou ficar invisível
      where: filtroDoFeed(viewerId, aba, cursor),
      orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }],
      select: postLido,
      take: limite,
    });
  }

  post(id: string) {
    return prisma.post.findUnique({ where: { id }, select: postLido });
  }

  postsDoUsuario(usuarioId: string, cursor: string | undefined, limite: number) {
    return prisma.post.findMany({
      where: filtroDosPostsDoUsuario(usuarioId, cursor),
      orderBy: [{ dia: 'desc' }, { id: 'desc' }],
      select: postLido,
      take: limite,
    });
  }

  // Em sequência (não Promise.all), como o resto do projeto
  async conteudo(plantaIds: string[], janela?: Janela) {
    const naJanela = janela ? filtrosDaJanela(janela) : null;
    const fotos = await prisma.foto.findMany({
      where: { plantaId: { in: plantaIds }, tipo: { not: 'VISAO_FUTURA' }, ...(naJanela ? { AND: [naJanela.fotos] } : {}) },
      select: {
        id: true,
        plantaId: true,
        caminhoArquivo: true,
        thumbnailUrl: true,
        tipo: true,
        dataCaptura: true,
        createdAt: true,
        agenda: { select: { status: true, dataConcluida: true, dataAgendada: true } },
      },
    });
    const cuidados = await prisma.agenda.findMany({
      where: { plantaId: { in: plantaIds }, status: 'CONCLUIDO', ...(naJanela ? { AND: [naJanela.cuidados] } : {}) },
      orderBy: [{ dataConcluida: 'asc' }, { createdAt: 'asc' }],
      select: {
        plantaId: true,
        dataConcluida: true,
        dataAgendada: true,
        detalhes: true,
        observacaoFutura: true,
        atividade: { select: { nome: true } },
      },
    });
    // plantaId não é nulo: o filtro acima só traz fotos dessas plantas
    return { fotos: fotos.map((f) => ({ ...f, plantaId: f.plantaId! })), cuidados };
  }

  async perfil(usuarioId: string, viewerId: string) {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        ...usuarioLido,
        bio: true,
        localidade: true,
        _count: { select: { seguidores: true, seguindo: true, plantas: { where: { plantaPublica: true } } } },
      },
    });
    if (!u) return null;
    const sigo =
      viewerId !== usuarioId &&
      !!(await prisma.amizade.findUnique({
        where: { seguidorId_seguidoId: { seguidorId: viewerId, seguidoId: usuarioId } },
        select: { seguidorId: true },
      }));
    const { _count, ...resto } = u;
    return { ...resto, plantas: _count.plantas, seguidores: _count.seguidores, seguindo: _count.seguindo, sigo };
  }

  plantasPublicas(usuarioId: string) {
    return prisma.planta.findMany({ where: { usuarioId, plantaPublica: true }, orderBy: { identificador: 'asc' }, select: plantaLida });
  }

  planta(id: string) {
    return prisma.planta.findUnique({
      where: { id },
      select: { ...plantaLida, usuario: { select: usuarioLido }, posts: { select: { id: true, dia: true } } },
    });
  }

  buscar(q: string, limite: number) {
    return prisma.usuario.findMany({
      where: filtroDaBusca(q),
      orderBy: { nomePublico: 'asc' },
      take: limite,
      select: usuarioLido,
    });
  }

  // Em sequência (não Promise.all), como o resto do projeto
  async interacoes(postIds: string[], viewerId: string) {
    const onde = { postId: { in: postIds } };
    const curtidas = await prisma.curtida.groupBy({ by: ['postId'], where: onde, _count: { _all: true } });
    const comentarios = await prisma.comentario.groupBy({ by: ['postId'], where: onde, _count: { _all: true } });
    const minhasCurtidas = await prisma.curtida.findMany({ where: { ...onde, usuarioId: viewerId }, select: { postId: true } });
    const meusSalvos = await prisma.salvo.findMany({ where: { ...onde, usuarioId: viewerId }, select: { postId: true } });
    return interacoesPorPost(postIds, {
      curtidas: curtidas.map((c) => ({ postId: c.postId, total: c._count._all })),
      comentarios: comentarios.map((c) => ({ postId: c.postId, total: c._count._all })),
      curtiu: minhasCurtidas.map((c) => c.postId),
      salvou: meusSalvos.map((s) => s.postId),
    });
  }

  comentarios(postId: string, cursor: string | undefined, limite: number) {
    return prisma.comentario.findMany({
      where: filtroDosComentarios(postId, cursor),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limite,
      select: comentarioLido,
    });
  }

  salvos(viewerId: string, cursor: string | undefined, limite: number) {
    return prisma.salvo.findMany({
      where: filtroDosSalvos(viewerId, cursor),
      orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
      take: limite,
      select: { createdAt: true, post: { select: postLido } },
    });
  }

  notificacoes(usuarioId: string, cursor: string | undefined, limite: number) {
    return prisma.notificacao.findMany({
      where: filtroDasNotificacoes(usuarioId, cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limite,
      select: {
        id: true,
        tipo: true,
        lida: true,
        createdAt: true,
        ator: { select: usuarioLido },
        post: { select: { id: true, planta: { select: { id: true, fotoCapaUrl: true } } } },
        comentario: { select: { texto: true } },
      },
    });
  }

  naoLidas(usuarioId: string) {
    return prisma.notificacao.count({ where: { usuarioId, lida: false } });
  }
}
