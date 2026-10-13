import { prisma } from '../../../lib/prisma';
import { filtroDaBusca, filtroDoFeed, filtroDosPostsDoUsuario, filtrosDaJanela } from './filtros';
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
}
