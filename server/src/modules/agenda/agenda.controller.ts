import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const agendaController = {
  // Criar um novo evento na agenda
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId, atividadeId, dataAgendada, observacoes } = req.body;

      // VERIFICAÇÃO DE SEGURANÇA: A planta pertence ao utilizador?
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
          planta: { usuarioId }, // Filtra pelos agendamentos das plantas do utilizador
        },
        include: {
          planta: { select: { id: true, nome: true } }, // Inclui info da planta
          atividade: { select: { id: true, nome: true } }, // Inclui info da atividade
        },
        orderBy: { dataAgendada: 'asc' },
      });
      return res.status(200).json(agendamentos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
  },

  // Atualizar um evento da agenda
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = req.params;
      const dataToUpdate = req.body;

      // VERIFICAÇÃO DE SEGURANÇA: O evento a ser atualizado pertence ao utilizador?
      const agendamentoExistente = await prisma.agenda.findFirst({
        where: { id, planta: { usuarioId } },
      });
      if (!agendamentoExistente) {
        return res.status(403).json({ message: 'Acesso negado ou agendamento não encontrado.' });
      }

      const agendamentoAtualizado = await prisma.agenda.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(agendamentoAtualizado);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apagar um evento da agenda
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = req.params;

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
