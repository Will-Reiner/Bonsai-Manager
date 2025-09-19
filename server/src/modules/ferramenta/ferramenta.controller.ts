import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createFerramentaSchema, updateFerramentaSchema, ferramentaIdSchema } from './ferramenta.schema';

export const ferramentaController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = createFerramentaSchema.parse(req).body;
      const novaFerramenta = await prisma.ferramenta.create({ data });
      return res.status(201).json(novaFerramenta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const ferramentas = await prisma.ferramenta.findMany();
      return res.status(200).json(ferramentas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar ferramentas.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = ferramentaIdSchema.parse(req).params;
      const ferramenta = await prisma.ferramenta.findUnique({ where: { id } });
      if (!ferramenta) {
        return res.status(404).json({ message: 'Ferramenta não encontrada.' });
      }
      return res.status(200).json(ferramenta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = ferramentaIdSchema.parse(req).params;
      const data = updateFerramentaSchema.parse(req).body;
      const ferramentaAtualizada = await prisma.ferramenta.update({
        where: { id },
        data,
      });
      return res.status(200).json(ferramentaAtualizada);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = ferramentaIdSchema.parse(req).params;
      await prisma.ferramenta.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};