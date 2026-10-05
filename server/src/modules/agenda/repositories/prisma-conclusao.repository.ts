import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ATIVIDADE_REVISAO,
  ConclusaoRepository,
  PlanoConclusao,
  PREF_REVISAO_DIAS,
  ResultadoConclusao,
} from '../agenda.types';

const REVISAO_PADRAO_DIAS = 30;

export class PrismaConclusaoRepository implements ConclusaoRepository {
  async findPendentesDoUsuario(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, status: 'PENDENTE', planta: { usuarioId } },
      select: { id: true, plantaId: true },
    });
  }

  async atividadesExistem(ids: string[]) {
    const total = await prisma.atividade.count({ where: { id: { in: ids } } });
    return total === ids.length;
  }

  async getRevisaoDias(usuarioId: string) {
    const pref = await prisma.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_REVISAO_DIAS } },
    });
    const dias = pref ? parseInt(pref.valor, 10) : REVISAO_PADRAO_DIAS;
    if (Number.isNaN(dias)) return REVISAO_PADRAO_DIAS;
    return Math.max(0, dias);
  }

  async proximaPendente(plantaId: string, aPartirDe: Date, excluir: string[]) {
    const proxima = await prisma.agenda.findFirst({
      where: { plantaId, status: 'PENDENTE', dataAgendada: { gte: aPartirDe }, id: { notIn: excluir } },
      orderBy: { dataAgendada: 'asc' },
      select: { dataAgendada: true },
    });
    return proxima?.dataAgendada ?? null;
  }

  async executar(plano: PlanoConclusao): Promise<ResultadoConclusao> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const concluidas = [];
        for (const a of plano.atualizacoes) {
          // Revalida PENDENTE dentro da transação (evita duplicidade em envio duplo)
          const { count } = await tx.agenda.updateMany({
            where: { id: a.agendaId, status: 'PENDENTE' },
            data: {
              status: 'CONCLUIDO',
              dataConcluida: plano.dataConcluida,
              ...(a.atividadeId ? { atividadeId: a.atividadeId } : {}),
              ...(a.detalhes !== undefined ? { detalhes: a.detalhes } : {}),
              ...(a.observacaoFutura !== undefined ? { observacaoFutura: a.observacaoFutura } : {}),
            },
          });
          if (count === 0) throw new Error('Acesso negado ou agendamento não encontrado.');
          concluidas.push(
            await tx.agenda.findUniqueOrThrow({
              where: { id: a.agendaId },
              include: { atividade: { select: { id: true, nome: true } } },
            }),
          );
        }

        for (const f of plano.fotos) {
          await tx.foto.create({
            data: {
              caminhoArquivo: f.caminhoArquivo,
              plantaId: f.plantaId,
              agendaId: f.agendaId,
              usuarioId: plano.usuarioId,
              titulo: concluidas.find((c) => c.id === f.agendaId)?.atividade?.nome,
              dataCaptura: plano.dataConcluida,
            },
          });
        }

        const criadas = [];
        for (const c of plano.criarConcluidas) {
          criadas.push(
            await tx.agenda.create({
              data: {
                plantaId: c.plantaId,
                atividadeId: c.atividadeId,
                dataAgendada: c.data,
                dataConcluida: c.data,
                status: 'CONCLUIDO',
                detalhes: c.detalhes,
              },
            }),
          );
        }
        for (const p of plano.criarPendentes) {
          criadas.push(await tx.agenda.create({ data: p }));
        }

        const revisoes = [];
        if (plano.revisoes.length) {
          // Garante a atividade mesmo se o seed não tiver rodado no ambiente
          const revisao = await tx.atividade.upsert({
            where: { nome: ATIVIDADE_REVISAO },
            update: {},
            create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
          });
          for (const r of plano.revisoes) {
            revisoes.push(
              await tx.agenda.create({
                data: { plantaId: r.plantaId, atividadeId: revisao.id, dataAgendada: r.dataAgendada },
              }),
            );
          }
        }

        return { concluidas, criadas, revisoes };
      },
      { timeout: 20_000 },
    );
  }
}
