import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createAtividadeSchema, updateAtividadeSchema, atividadeIdSchema } from './atividade.schema';

export const atividadeController = {
  create: async (req: Request, res: Response) => {
    try {
      // O schema de validação agora inclui os novos campos
      const data = createAtividadeSchema.parse(req).body;
      const novaAtividade = await prisma.atividade.create({
        data, // Passamos todos os dados validados diretamente para o Prisma
      });
      return res.status(201).json(novaAtividade);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const atividades = await prisma.atividade.findMany();
      return res.status(200).json(atividades);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar atividades.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      const atividade = await prisma.atividade.findUnique({ where: { id } });
      if (!atividade) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }
      return res.status(200).json(atividade);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      // O schema de validação agora inclui os novos campos para atualização
      const data = updateAtividadeSchema.parse(req).body;
      const atividadeAtualizada = await prisma.atividade.update({
        where: { id },
        data, // Passamos todos os dados validados diretamente para o Prisma
      });
      return res.status(200).json(atividadeAtualizada);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      await prisma.atividade.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};