import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createTipoRecursoSchema, updateTipoRecursoSchema, tipoRecursoIdSchema } from './tipo-recurso.schema';

export const tipoRecursoController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = createTipoRecursoSchema.parse(req).body;
      const novoTipoRecurso = await prisma.tipoRecurso.create({
        data,
      });
      return res.status(201).json(novoTipoRecurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const tiposRecurso = await prisma.tipoRecurso.findMany();
      return res.status(200).json(tiposRecurso);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tipos de recurso.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = tipoRecursoIdSchema.parse(req).params;
      const tipoRecurso = await prisma.tipoRecurso.findUnique({ where: { id } });
      if (!tipoRecurso) {
        return res.status(404).json({ message: 'Tipo de recurso não encontrado.' });
      }
      return res.status(200).json(tipoRecurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = updateTipoRecursoSchema.parse(req).params;
      const data = updateTipoRecursoSchema.parse(req).body;
      const tipoRecursoAtualizado = await prisma.tipoRecurso.update({
        where: { id },
        data,
      });
      return res.status(200).json(tipoRecursoAtualizado);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = tipoRecursoIdSchema.parse(req).params;
      await prisma.tipoRecurso.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};