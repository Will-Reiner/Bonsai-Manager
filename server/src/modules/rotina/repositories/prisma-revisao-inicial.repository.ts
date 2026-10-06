import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { ATIVIDADE_REVISAO, PREF_REVISAO_DIAS } from '../../agenda/agenda.types';
import { RevisaoInicialRepository } from '../../planta/types/planta.types';

const REVISAO_PADRAO_DIAS = 30;

export class PrismaRevisaoInicialRepository implements RevisaoInicialRepository {
  async getRevisaoDias(usuarioId: string) {
    const pref = await prisma.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_REVISAO_DIAS } },
    });
    const dias = pref ? parseInt(pref.valor, 10) : REVISAO_PADRAO_DIAS;
    if (Number.isNaN(dias)) return REVISAO_PADRAO_DIAS;
    return Math.min(3650, Math.max(0, dias));
  }

  async criarRevisao(plantaId: string, intervaloDias: number, primeiraData: Date) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Garante a atividade mesmo se o seed não tiver rodado no ambiente
      const atividade = await tx.atividade.upsert({
        where: { nome: ATIVIDADE_REVISAO },
        update: {},
        create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
      });
      const rotina = await tx.rotina.create({
        data: { plantaId, atividadeId: atividade.id, intervaloDias, revisao: true },
      });
      await tx.agenda.create({
        data: { plantaId, atividadeId: atividade.id, dataAgendada: primeiraData, rotinaId: rotina.id },
      });
    });
  }
}
