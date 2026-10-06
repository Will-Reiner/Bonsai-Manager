import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { ProximaDeRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, NovaRotina, RotinaRepository } from '../rotina.types';

const INCLUDE_LISTA = {
  atividade: { select: { id: true, nome: true } },
  planta: { select: { id: true, nome: true, identificador: true } },
  agendas: {
    where: { status: 'PENDENTE' as const },
    select: { id: true, dataAgendada: true },
    orderBy: { dataAgendada: 'asc' as const },
    take: 1,
  },
};

export class PrismaRotinaRepository implements RotinaRepository {
  async contarPlantasDoUsuario(plantaIds: string[], usuarioId: string) {
    return prisma.planta.count({ where: { id: { in: plantaIds }, usuarioId } });
  }

  async atividadesExistem(ids: string[]) {
    return (await prisma.atividade.count({ where: { id: { in: ids } } })) === ids.length;
  }

  async existentes(plantaIds: string[], atividadeIds: string[]) {
    return prisma.rotina.findMany({
      where: { plantaId: { in: plantaIds }, atividadeId: { in: atividadeIds } },
      select: { plantaId: true, atividadeId: true },
    });
  }

  async criar(itens: NovaRotina[]) {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const criadas = [];
        for (const n of itens) {
          const rotina = await tx.rotina.create({
            data: { plantaId: n.plantaId, atividadeId: n.atividadeId, intervaloDias: n.intervaloDias, dataFim: n.dataFim },
          });
          await tx.agenda.create({
            data: {
              plantaId: n.plantaId,
              atividadeId: n.atividadeId,
              dataAgendada: n.primeiraData,
              rotinaId: rotina.id,
              ...(n.detalhes ? { detalhes: n.detalhes } : {}),
            },
          });
          criadas.push(rotina);
        }
        return criadas;
      },
      { timeout: 20_000 },
    );
  }

  async listar(usuarioId: string, plantaId?: string) {
    const rotinas = await prisma.rotina.findMany({
      where: { planta: { usuarioId }, ...(plantaId ? { plantaId } : {}) },
      include: INCLUDE_LISTA,
      orderBy: { createdAt: 'asc' },
    });
    return rotinas.map(({ agendas, ...r }) => ({ ...r, proxima: agendas[0] ?? null }));
  }

  async findDoUsuario(id: string, usuarioId: string) {
    const r = await prisma.rotina.findFirst({
      where: { id, planta: { usuarioId } },
      include: {
        agendas: {
          where: { status: { in: ['PENDENTE', 'CONCLUIDO'] } },
          select: { id: true, status: true, dataAgendada: true, dataConcluida: true },
        },
      },
    });
    if (!r) return null;
    const { agendas, ...rotina } = r;
    const conclusoes = agendas
      .filter((a) => a.status === 'CONCLUIDO')
      .map((a) => (a.dataConcluida ?? a.dataAgendada).getTime());
    return {
      id: rotina.id,
      plantaId: rotina.plantaId,
      atividadeId: rotina.atividadeId,
      intervaloDias: rotina.intervaloDias,
      dataFim: rotina.dataFim,
      pausada: rotina.pausada,
      pendenteId: agendas.find((a) => a.status === 'PENDENTE')?.id ?? null,
      ultimaConclusao: conclusoes.length ? new Date(Math.max(...conclusoes)) : null,
    };
  }

  async atualizar(
    id: string,
    dados: { intervaloDias?: number; dataFim?: Date | null; pausada?: boolean },
    ajuste: AjustePendente,
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rotina = await tx.rotina.update({ where: { id }, data: dados });
      if (ajuste.tipo === 'mover') {
        await tx.agenda.update({ where: { id: ajuste.agendaId }, data: { dataAgendada: ajuste.data } });
      } else if (ajuste.tipo === 'cancelar') {
        await tx.agenda.update({ where: { id: ajuste.agendaId }, data: { status: 'CANCELADO' } });
      } else if (ajuste.tipo === 'criar') {
        await tx.agenda.create({
          data: { plantaId: rotina.plantaId, atividadeId: rotina.atividadeId, dataAgendada: ajuste.data, rotinaId: id },
        });
      }
      const { agendas, ...r } = await tx.rotina.findUniqueOrThrow({ where: { id }, include: INCLUDE_LISTA });
      return { ...r, proxima: agendas[0] ?? null };
    });
  }

  async apagar(id: string) {
    await prisma.$transaction([
      prisma.agenda.updateMany({ where: { rotinaId: id, status: 'PENDENTE' }, data: { status: 'CANCELADO' } }),
      prisma.rotina.delete({ where: { id } }),
    ]);
  }

  async findPendenteComRotina(agendaId: string, usuarioId: string) {
    return prisma.agenda.findFirst({
      where: { id: agendaId, status: 'PENDENTE', planta: { usuarioId } },
      select: {
        id: true,
        rotina: { select: { id: true, plantaId: true, atividadeId: true, intervaloDias: true, dataFim: true, pausada: true } },
      },
    });
  }

  async pular(agendaId: string, proxima: ProximaDeRotina | null) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Revalida PENDENTE: dois toques em "pular" não geram duas próximas
      const { count } = await tx.agenda.updateMany({
        where: { id: agendaId, status: 'PENDENTE' },
        data: { status: 'CANCELADO', pulada: true },
      });
      if (count === 0) throw new Error('Acesso negado ou agendamento não encontrado.');
      if (proxima) await tx.agenda.create({ data: proxima });
    });
  }
}
