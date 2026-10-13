import { prisma } from '../../../lib/prisma';
import type { InteracoesRepository, NovaNotificacao } from '../comunidade.types';

const usuarioLido = { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true, perfilPublico: true, historicoPublico: true } as const;

export class PrismaInteracoesRepository implements InteracoesRepository {
  async curtir(usuarioId: string, postId: string) {
    const { count } = await prisma.curtida.createMany({ data: [{ usuarioId, postId }], skipDuplicates: true });
    return count > 0;
  }

  async descurtir(usuarioId: string, postId: string) {
    const { count } = await prisma.curtida.deleteMany({ where: { usuarioId, postId } });
    return count > 0;
  }

  totalCurtidas(postId: string) {
    return prisma.curtida.count({ where: { postId } });
  }

  async salvar(usuarioId: string, postId: string) {
    await prisma.salvo.createMany({ data: [{ usuarioId, postId }], skipDuplicates: true });
  }

  async dessalvar(usuarioId: string, postId: string) {
    await prisma.salvo.deleteMany({ where: { usuarioId, postId } });
  }

  comentar(usuarioId: string, postId: string, texto: string) {
    return prisma.comentario.create({
      data: { usuarioId, postId, texto },
      select: { id: true, texto: true, createdAt: true, usuario: { select: usuarioLido }, post: { select: { usuarioId: true } } },
    });
  }

  comentario(id: string) {
    return prisma.comentario.findUnique({ where: { id }, select: { id: true, usuarioId: true, post: { select: { usuarioId: true } } } });
  }

  async apagarComentario(id: string) {
    // A notificação COMENTARIO cai junto (cascata pelo comentarioId)
    await prisma.comentario.deleteMany({ where: { id } });
  }

  async notificar(n: NovaNotificacao) {
    await prisma.notificacao.create({ data: n });
  }

  async removerNotificacoes(n: Omit<NovaNotificacao, 'comentarioId'>) {
    await prisma.notificacao.deleteMany({ where: n });
  }

  async marcarLidas(usuarioId: string) {
    await prisma.notificacao.updateMany({ where: { usuarioId, lida: false }, data: { lida: true } });
  }
}
