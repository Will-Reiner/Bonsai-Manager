import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CuidadoRepository, PlanoEdicaoCuidado } from '../agenda.types';
import { Db } from '../../planta/use-cases/reavaliar-grupos';

export class PrismaCuidadoRepository implements CuidadoRepository {
  async findDoUsuario(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, planta: { usuarioId } },
      select: { id: true, plantaId: true, status: true },
    });
  }

  async editar(plano: PlanoEdicaoCuidado, depois: (db: Db) => Promise<void>) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (plano.dataConcluida) {
        await tx.agenda.updateMany({ where: { id: { in: plano.manter } }, data: { dataConcluida: plano.dataConcluida } });
      }
      for (const t of plano.textos) {
        await tx.agenda.update({
          where: { id: t.agendaId },
          data: {
            ...(t.detalhes !== undefined ? { detalhes: t.detalhes } : {}),
            ...(t.observacaoFutura !== undefined ? { observacaoFutura: t.observacaoFutura } : {}),
          },
        });
      }
      // Fotos das tarefas tiradas ficam na galeria (agendaId → null pelo banco)
      if (plano.remover.length) await tx.agenda.deleteMany({ where: { id: { in: plano.remover } } });
      await depois(tx);
      return tx.agenda.findMany({ where: { id: { in: plano.manter } } });
    });
  }

  async excluir(ids: string[], depois: (db: Db) => Promise<void>) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.agenda.deleteMany({ where: { id: { in: ids } } });
      await depois(tx);
    });
  }
}
