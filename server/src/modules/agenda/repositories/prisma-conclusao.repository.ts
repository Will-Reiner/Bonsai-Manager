import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import {
  ATIVIDADE_REVISAO,
  ConclusaoRepository,
  NovaRotinaDePasso,
  PlanoConclusao,
  PlanoRegistro,
  PREF_REVISAO_DIAS,
  ResultadoConclusao,
} from '../agenda.types';

const REVISAO_PADRAO_DIAS = 30;

export class PrismaConclusaoRepository implements ConclusaoRepository {
  async findPendentesDoUsuario(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, status: 'PENDENTE', planta: { usuarioId } },
      select: { id: true, plantaId: true, atividadeId: true, rotinaId: true },
    });
  }

  async findPendentesParaReconciliar(ids: string[], usuarioId: string) {
    return prisma.agenda.findMany({
      where: { id: { in: ids }, status: 'PENDENTE', planta: { usuarioId } },
      select: { id: true, plantaId: true, atividadeId: true, dataAgendada: true, rotinaId: true },
    });
  }

  async estadoRotinas(rotinaIds: string[], excluirAgendaIds: string[]) {
    const rotinas = await prisma.rotina.findMany({
      where: { id: { in: rotinaIds } },
      select: {
        id: true,
        plantaId: true,
        atividadeId: true,
        intervaloDias: true,
        dataFim: true,
        pausada: true,
        estacoes: true,
        revisao: true,
        _count: { select: { agendas: { where: { status: 'PENDENTE', id: { notIn: excluirAgendaIds } } } } },
      },
    });
    return rotinas.map(({ _count, ...r }) => ({ ...r, temPendente: _count.agendas > 0 }));
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

  async proximasPendentes(plantaIds: string[], aPartirDe: Date, excluir: string[]) {
    if (!plantaIds.length) return new Map<string, Date>();
    const grupos = await prisma.agenda.groupBy({
      by: ['plantaId'],
      where: {
        plantaId: { in: plantaIds },
        status: 'PENDENTE',
        dataAgendada: { gte: aPartirDe },
        id: { notIn: excluir },
      },
      _min: { dataAgendada: true },
    });
    const proximas = new Map<string, Date>();
    for (const g of grupos) if (g._min.dataAgendada) proximas.set(g.plantaId, g._min.dataAgendada);
    return proximas;
  }

  /** Próximo passo com repetição: cria a rotina (ou usa a existente) e a pendente, mantendo 1 pendente por rotina. */
  private async criarComRotinas(tx: Prisma.TransactionClient, itens: NovaRotinaDePasso[]) {
    const criadas = [];
    for (const r of itens) {
      const existente = await tx.rotina.findUnique({
        where: { plantaId_atividadeId: { plantaId: r.plantaId, atividadeId: r.atividadeId } },
        select: {
          id: true,
          pausada: true,
          dataFim: true,
          _count: { select: { agendas: { where: { status: 'PENDENTE' } } } },
        },
      });
      // Rotina existente com pendente, pausada ou encerrada antes da data: a nova tarefa fica avulsa
      // (não reativa a rotina nem cria tarefa depois da data final dela)
      const rotinaId = existente
        ? existente._count.agendas || existente.pausada || (existente.dataFim && existente.dataFim < r.dataAgendada)
          ? undefined
          : existente.id
        : (
            await tx.rotina.create({
              data: { plantaId: r.plantaId, atividadeId: r.atividadeId, intervaloDias: r.intervaloDias, dataFim: r.dataFim, estacoes: r.estacoes },
            })
          ).id;
      criadas.push(
        await tx.agenda.create({
          data: { plantaId: r.plantaId, atividadeId: r.atividadeId, dataAgendada: r.dataAgendada, rotinaId },
        }),
      );
    }
    return criadas;
  }

  private async criarRevisoes(tx: Prisma.TransactionClient, revisoes: { plantaId: string; dataAgendada: Date }[]) {
    if (!revisoes.length) return [];
    // Garante a atividade mesmo se o seed não tiver rodado no ambiente
    const revisao = await tx.atividade.upsert({
      where: { nome: ATIVIDADE_REVISAO },
      update: {},
      create: { nome: ATIVIDADE_REVISAO, descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
    });
    return tx.agenda.createManyAndReturn({
      data: revisoes.map((r) => ({ plantaId: r.plantaId, atividadeId: revisao.id, dataAgendada: r.dataAgendada })),
    });
  }

  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string) {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }

  async registrar(plano: PlanoRegistro): Promise<ResultadoConclusao> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Poucas idas ao banco, independente do número de plantas (lotes grandes estouravam o tempo)
        const absorvidos = new Set(plano.absorver.map((a) => `${a.plantaId}|${a.atividadeId}`));
        const novas = plano.cuidados.flatMap((c) =>
          c.atividadeIds.flatMap((atividadeId, i) =>
            absorvidos.has(`${c.plantaId}|${atividadeId}`)
              ? []
              : [
                  {
                    plantaId: c.plantaId,
                    atividadeId,
                    dataAgendada: plano.data,
                    dataConcluida: plano.data,
                    status: 'CONCLUIDO' as const,
                    // Nota e obs. só no primeiro cuidado: no histórico os cuidados do dia aparecem juntos
                    ...(i === 0 ? { detalhes: c.detalhes, observacaoFutura: c.observacaoFutura } : {}),
                  },
                ],
          ),
        );
        const criadasAgora = novas.length ? await tx.agenda.createManyAndReturn({ data: novas }) : [];

        // Pendentes escolhidas na tela viram o registro; revalida PENDENTE (envio duplo não conclui duas vezes)
        const cuidadoDe = new Map(plano.cuidados.map((c) => [c.plantaId, c]));
        for (const a of plano.absorver) {
          const c = cuidadoDe.get(a.plantaId)!;
          const primeiro = c.atividadeIds[0] === a.atividadeId;
          const { count } = await tx.agenda.updateMany({
            where: { id: a.agendaId, status: 'PENDENTE' },
            data: {
              status: 'CONCLUIDO',
              dataConcluida: plano.data,
              // Sem nota no registro, mantém a instrução que veio do agendamento
              ...(primeiro && c.detalhes !== undefined ? { detalhes: c.detalhes } : {}),
              ...(primeiro && c.observacaoFutura !== undefined ? { observacaoFutura: c.observacaoFutura } : {}),
            },
          });
          if (count === 0) throw new Error('Acesso negado ou agendamento não encontrado.');
        }
        if (plano.cancelar.length) {
          await tx.agenda.updateMany({
            where: { id: { in: plano.cancelar }, status: 'PENDENTE' },
            data: { status: 'CANCELADO' },
          });
        }
        const absorvidas = plano.absorver.length
          ? await tx.agenda.findMany({ where: { id: { in: plano.absorver.map((a) => a.agendaId) } } })
          : [];
        const concluidas = [...criadasAgora, ...absorvidas];

        const comFotos = plano.cuidados.filter((c) => c.fotos.length);
        if (comFotos.length) {
          // Fotos vão no primeiro cuidado da planta (planta + atividade é único no lote)
          const agendaDe = new Map(concluidas.map((a) => [`${a.plantaId}|${a.atividadeId}`, a.id]));
          const atividades = await tx.atividade.findMany({
            where: { id: { in: [...new Set(comFotos.map((c) => c.atividadeIds[0]))] } },
            select: { id: true, nome: true },
          });
          const nomeDe = new Map(atividades.map((a) => [a.id, a.nome]));
          await tx.foto.createMany({
            data: comFotos.flatMap((c) =>
              c.fotos.map((f) => ({
                caminhoArquivo: f.caminhoArquivo,
                dataCaptura: f.dataCaptura,
                plantaId: c.plantaId,
                agendaId: agendaDe.get(`${c.plantaId}|${c.atividadeIds[0]}`)!,
                usuarioId: plano.usuarioId,
                titulo: nomeDe.get(c.atividadeIds[0]),
              })),
            ),
          });
        }

        const criadas = [
          ...(plano.criarPendentes.length ? await tx.agenda.createManyAndReturn({ data: plano.criarPendentes }) : []),
          ...(await this.criarComRotinas(tx, plano.criarRotinas)),
        ];
        const revisoes = await this.criarRevisoes(tx, plano.revisoes);
        return { concluidas, criadas, revisoes };
      },
      { timeout: 20_000 },
    );
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
              ...(a.desvincularRotina ? { rotinaId: null } : {}),
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
        criadas.push(...(await this.criarComRotinas(tx, plano.criarRotinas)));

        const revisoes = await this.criarRevisoes(tx, plano.revisoes);

        return { concluidas, criadas, revisoes };
      },
      { timeout: 20_000 },
    );
  }
}
