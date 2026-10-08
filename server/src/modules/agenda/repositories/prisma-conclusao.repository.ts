import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { diasDeTransplante } from '../../planta/dominio/grupo';
import {
  AtualizacaoGrupo,
  ConclusaoRepository,
  ATIVIDADE_TRANSPLANTE,
  PREF_TRANSPLANTE_DIAS,
  NovaRotinaDePasso,
  PlanoConclusao,
  PlanoRegistro,
  ResultadoConclusao,
} from '../agenda.types';

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
        _count: { select: { agendas: { where: { status: 'PENDENTE', id: { notIn: excluirAgendaIds } } } } },
      },
    });
    return rotinas.map(({ _count, ...r }) => ({ ...r, temPendente: _count.agendas > 0 }));
  }

  async atividadesExistem(ids: string[]) {
    const total = await prisma.atividade.count({ where: { id: { in: ids } } });
    return total === ids.length;
  }

  /** Aplica mudanças de grupo (Transplante → Recém transplantada). */
  private async atualizarGrupos(tx: Prisma.TransactionClient, itens: AtualizacaoGrupo[]) {
    for (const g of itens) {
      await tx.planta.update({
        where: { id: g.plantaId },
        data: { grupo: g.grupo, grupoAnterior: g.grupoAnterior, grupoExpiraEm: g.grupoExpiraEm },
      });
    }
  }

  /** Próximo passo com repetição: cria a rotina (ou usa a existente) e a pendente, mantendo 1 pendente por rotina. */
  private async criarComRotinas(tx: Prisma.TransactionClient, itens: NovaRotinaDePasso[]) {
    if (!itens.length) return [];
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
              data: {
                plantaId: r.plantaId,
                atividadeId: r.atividadeId,
                intervaloDias: r.intervaloDias,
                dataFim: r.dataFim,
                estacoes: r.estacoes,
              },
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

  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string) {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }

  async transplanteDasPlantas(plantaIds: string[], usuarioId: string) {
    const [atividade, pref, plantas] = await Promise.all([
      prisma.atividade.findUnique({ where: { nome: ATIVIDADE_TRANSPLANTE }, select: { id: true } }),
      prisma.preferenciaUsuario.findUnique({
        where: { usuarioId_chave: { usuarioId, chave: PREF_TRANSPLANTE_DIAS } },
      }),
      prisma.planta.findMany({
        where: { id: { in: plantaIds }, usuarioId },
        select: { id: true, grupo: true, grupoAnterior: true, grupoExpiraEm: true },
      }),
    ]);
    return {
      atividadeId: atividade?.id ?? null,
      dias: diasDeTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...g }) => ({ plantaId: id, ...g })),
    };
  }

  async registrar(plano: PlanoRegistro): Promise<ResultadoConclusao> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Poucas idas ao banco, independente do número de plantas (lotes grandes estouravam o tempo)
        const absorvidos = new Set(plano.absorver.map((a) => `${a.plantaId}|${a.atividadeId}`));
        const novas = plano.cuidados.flatMap((c) =>
          c.atividadeIds.flatMap((atividadeId) =>
            absorvidos.has(`${c.plantaId}|${atividadeId}`)
              ? []
              : [
                  {
                    plantaId: c.plantaId,
                    atividadeId,
                    dataAgendada: plano.data,
                    dataConcluida: plano.data,
                    status: 'CONCLUIDO' as const,
                    // Nota e obs. do registro valem para todos os cuidados da planta (o histórico junta os do dia)
                    detalhes: c.detalhes,
                    observacaoFutura: c.observacaoFutura,
                  },
                ],
          ),
        );
        const criadasAgora = novas.length ? await tx.agenda.createManyAndReturn({ data: novas }) : [];

        // Pendentes escolhidas na tela viram o registro; revalida PENDENTE (envio duplo não conclui duas vezes)
        const cuidadoDe = new Map(plano.cuidados.map((c) => [c.plantaId, c]));
        for (const a of plano.absorver) {
          const c = cuidadoDe.get(a.plantaId)!;
          const { count } = await tx.agenda.updateMany({
            where: { id: a.agendaId, status: 'PENDENTE' },
            data: {
              status: 'CONCLUIDO',
              dataConcluida: plano.data,
              // Sem nota no registro, mantém a instrução que veio do agendamento
              ...(c.detalhes !== undefined ? { detalhes: c.detalhes } : {}),
              ...(c.observacaoFutura !== undefined ? { observacaoFutura: c.observacaoFutura } : {}),
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
        await this.atualizarGrupos(tx, plano.atualizarGrupos);
        return { concluidas, criadas };
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

        await this.atualizarGrupos(tx, plano.atualizarGrupos);
        return { concluidas, criadas };
      },
      { timeout: 20_000 },
    );
  }
}
