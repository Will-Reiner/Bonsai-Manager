import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createHistoricoSchema, updateHistoricoSchema, historicoIdSchema, plantaIdSchema } from './historico.schema';

export const historicoController = {
  // Criar um novo registro histórico
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createHistoricoSchema.parse(req).body;

      // Verificar se a planta pertence ao usuário logado
      const planta = await prisma.planta.findFirst({
        where: { id: data.plantaId, usuarioId },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const novoHistorico = await prisma.registroAtividadeHistorico.create({
        data,
      });

      return res.status(201).json(novoHistorico);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Listar todos os registros históricos de uma planta específica
  getAllByPlanta: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId } = plantaIdSchema.parse(req).params;

      // Verificar se a planta pertence ao usuário logado
      const planta = await prisma.planta.findFirst({
        where: { id: plantaId, usuarioId },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const historicos = await prisma.registroAtividadeHistorico.findMany({
        where: { plantaId },
        orderBy: { dataRealizacao: 'desc' },
      });

      return res.status(200).json(historicos);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Obter um registro histórico específico
  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = historicoIdSchema.parse(req).params;

      const historico = await prisma.registroAtividadeHistorico.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!historico) {
        return res.status(404).json({ message: 'Registro histórico não encontrado.' });
      }

      // Verificar se a planta do histórico pertence ao usuário logado
      if (historico.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a este registro histórico.' });
      }

      return res.status(200).json(historico);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualizar um registro histórico
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = updateHistoricoSchema.parse(req).params;
      const dataToUpdate = updateHistoricoSchema.parse(req).body;

      // Buscar o histórico e verificar se a planta pertence ao usuário
      const historico = await prisma.registroAtividadeHistorico.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!historico) {
        return res.status(404).json({ message: 'Registro histórico não encontrado.' });
      }

      if (historico.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a este registro histórico.' });
      }

      // Se estiver atualizando a plantaId, verificar se a nova planta também pertence ao usuário
      if (dataToUpdate.plantaId && dataToUpdate.plantaId !== historico.plantaId) {
        const novaPlanta = await prisma.planta.findFirst({
          where: { id: dataToUpdate.plantaId, usuarioId },
        });

        if (!novaPlanta) {
          return res.status(404).json({ message: 'Nova planta não encontrada ou não pertence a si.' });
        }
      }

      const historicoAtualizado = await prisma.registroAtividadeHistorico.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(historicoAtualizado);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apagar um registro histórico
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = historicoIdSchema.parse(req).params;

      // Buscar o histórico e verificar se a planta pertence ao usuário
      const historico = await prisma.registroAtividadeHistorico.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!historico) {
        return res.status(404).json({ message: 'Registro histórico não encontrado.' });
      }

      if (historico.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a este registro histórico.' });
      }

      await prisma.registroAtividadeHistorico.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};