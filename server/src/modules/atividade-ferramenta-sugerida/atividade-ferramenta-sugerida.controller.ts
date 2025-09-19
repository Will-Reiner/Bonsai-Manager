import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { atividadeFerramentaSugeridaSchema } from './atividade-ferramenta-sugerida.schema';

export const atividadeFerramentaSugeridaController = {
  // Cria a associação
  create: async (req: Request, res: Response) => {
    try {
      const { atividadeId, ferramentaId } = atividadeFerramentaSugeridaSchema.parse(req).params;
      const novaAssociacao = await prisma.atividadeFerramentaSugerida.create({
        data: { atividadeId, ferramentaId },
      });
      return res.status(201).json(novaAssociacao);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apaga a associação
  delete: async (req: Request, res: Response) => {
    try {
      const { atividadeId, ferramentaId } = atividadeFerramentaSugeridaSchema.parse(req).params;
      await prisma.atividadeFerramentaSugerida.delete({
        where: {
          atividadeId_ferramentaId: { atividadeId, ferramentaId },
        },
      });
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};