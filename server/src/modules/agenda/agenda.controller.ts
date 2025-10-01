import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { createAgendaSchema, updateAgendaSchema, agendaIdSchema } from './agenda.schema';

export const agendaController = {
  // Criar um novo evento na agenda
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId, atividadeId, dataAgendada, observacoes } = createAgendaSchema.parse(req).body;

      const plantaPertenceAoUtilizador = await prisma.planta.findFirst({
        where: { id: plantaId, usuarioId },
      });
      if (!plantaPertenceAoUtilizador) {
        return res.status(403).json({ message: 'Acesso negado. A planta não pertence a si.' });
      }

      const novoAgendamento = await prisma.agenda.create({
        data: { plantaId, atividadeId, dataAgendada, observacoes },
      });

      return res.status(201).json(novoAgendamento);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Listar todos os eventos da agenda do utilizador logado
  getAllByUser: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const agendamentos = await prisma.agenda.findMany({
        where: {
          planta: { usuarioId },
        },
        include: {
          planta: { select: { id: true, nome: true, especie: true } },
          atividade: { select: { id: true, nome: true } },
          recursosUtilizados: { include: { recurso: { include: { tipoRecurso: true } } } },
        },
        orderBy: { dataAgendada: 'asc' },
      });
      return res.status(200).json(agendamentos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
  },

  // Atualizar um evento da agenda (agora também serve para "completar" a tarefa)
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = agendaIdSchema.parse(req).params;
      const { recursosUtilizados, ...dataToUpdate } = updateAgendaSchema.parse(req).body;

      const agendamentoExistente = await prisma.agenda.findFirst({
        where: { id, planta: { usuarioId } },
      });
      if (!agendamentoExistente) {
        return res.status(403).json({ message: 'Acesso negado ou agendamento não encontrado.' });
      }

      // Usamos uma transação para garantir que ambas as operações (atualizar agenda e criar histórico de recursos)
      // aconteçam com sucesso, ou nenhuma delas acontece.
      const agendamentoAtualizado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updated = await tx.agenda.update({
          where: { id },
          data: dataToUpdate,
        });

        if (recursosUtilizados && recursosUtilizados.length > 0) {
          // Apaga registros antigos para evitar duplicatas, caso seja uma re-edição
          await tx.agendaRecursoUtilizado.deleteMany({ where: { agendaId: id } });

          // Cria os novos registros de recursos utilizados
          await tx.agendaRecursoUtilizado.createMany({
            data: recursosUtilizados.map(r => ({
              agendaId: id,
              recursoId: r.recursoId,
              quantidadeUtilizada: r.quantidadeUtilizada,
            })),
          });
        }
        return updated;
      });

      return res.status(200).json(agendamentoAtualizado);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apagar um evento da agenda (sem mudanças)
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = agendaIdSchema.parse(req).params;

      const agendamentoExistente = await prisma.agenda.findFirst({
        where: { id, planta: { usuarioId } },
      });
      if (!agendamentoExistente) {
        return res.status(403).json({ message: 'Acesso negado ou agendamento não encontrado.' });
      }

      await prisma.agenda.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};