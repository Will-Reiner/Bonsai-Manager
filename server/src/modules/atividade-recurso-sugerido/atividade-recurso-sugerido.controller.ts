import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { atividadeRecursoSugeridoSchema } from './atividade-recurso-sugerido.schema';

export const atividadeRecursoSugeridoController = {
  // Cria a associação
  create: async (req: Request, res: Response) => {
    try {
      const { atividadeId, tipoRecursoId } = atividadeRecursoSugeridoSchema.parse(req).params;
      const novaAssociacao = await prisma.atividadeRecursoSugerido.create({
        data: { atividadeId, tipoRecursoId },
      });
      return res.status(201).json(novaAssociacao);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apaga a associação
  delete: async (req: Request, res: Response) => {
    try {
      const { atividadeId, tipoRecursoId } = atividadeRecursoSugeridoSchema.parse(req).params;
      await prisma.atividadeRecursoSugerido.delete({
        where: {
          atividadeId_tipoRecursoId: { atividadeId, tipoRecursoId },
        },
      });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};