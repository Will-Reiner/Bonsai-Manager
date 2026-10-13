import { prisma } from '../../../lib/prisma';
import type { Db } from '../../planta/use-cases/reavaliar-grupos';
import type { PlanoPosts } from '../dominio/post';
import { EstadoPostsDaPlanta, PostsRepository } from '../comunidade.types';

/** "AAAA-MM-DD" ↔ coluna DATE (meia-noite UTC). */
const paraData = (dia: string) => new Date(`${dia}T00:00:00.000Z`);
const paraDia = (data: Date) => data.toISOString().slice(0, 10);

export class PrismaPostsRepository implements PostsRepository {
  async estadoDasPlantas(plantaIds: string[], db: Db = prisma): Promise<EstadoPostsDaPlanta[]> {
    const plantas = await db.planta.findMany({
      where: { id: { in: plantaIds } },
      select: {
        id: true,
        usuarioId: true,
        plantaPublica: true,
        usuario: { select: { perfilPublico: true, postarAutomatico: true } },
        fotos: {
          select: {
            tipo: true,
            dataCaptura: true,
            createdAt: true,
            agenda: { select: { status: true, dataConcluida: true, dataAgendada: true } },
          },
        },
        posts: { select: { dia: true } },
      },
    });
    return plantas.map((p) => ({
      plantaId: p.id,
      usuarioId: p.usuarioId,
      plantaPublica: p.plantaPublica,
      perfilPublico: p.usuario.perfilPublico,
      postarAutomatico: p.usuario.postarAutomatico,
      fotos: p.fotos,
      diasComPost: p.posts.map((x) => paraDia(x.dia)),
    }));
  }

  // Em sequência (não Promise.all) para funcionar dentro de transação interativa
  async aplicar(plantaId: string, usuarioId: string, plano: PlanoPosts, db: Db = prisma): Promise<void> {
    if (plano.apagar.length) {
      await db.post.deleteMany({ where: { plantaId, dia: { in: plano.apagar.map(paraData) } } });
    }
    if (plano.criar.length) {
      await db.post.createMany({
        data: plano.criar.map((c) => ({ plantaId, usuarioId, dia: paraData(c.dia), noFeed: c.noFeed })),
        skipDuplicates: true,
      });
    }
  }
}
