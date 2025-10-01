import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createGuiaDeTecnicasSchema, updateGuiaDeTecnicasSchema, GuiaDeTecnicasIdSchema } from './guia-de-tecnicas.schema';

export const guiaDeTecnicasController = {
  // Cria uma nova associação entre espécie e atividade
  create: async (req: Request, res: Response) => {
    try {
      const data = createGuiaDeTecnicasSchema.parse(req).body;
      const novaAssociacao = await prisma.guiaDeTecnicas.create({ data });
      return res.status(201).json(novaAssociacao);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualiza uma associação existente
  update: async (req: Request, res: Response) => {
    try {
        const { especieId, atividadeId } = GuiaDeTecnicasIdSchema.parse(req).params;
        const data = updateGuiaDeTecnicasSchema.parse(req).body;

        const associacaoAtualizada = await prisma.guiaDeTecnicas.update({
            where: {
                especieId_atividadeId: { especieId, atividadeId }
            },
            data,
        });
        return res.status(200).json(associacaoAtualizada);
    } catch (error) {
        return res.status(400).json({ error });
    }
  },

  // Apaga uma associação
  delete: async (req: Request, res: Response) => {
    try {
        const { especieId, atividadeId } = GuiaDeTecnicasIdSchema.parse(req).params;
        await prisma.guiaDeTecnicas.delete({
            where: {
                especieId_atividadeId: { especieId, atividadeId }
            }
        });
        return res.status(204).send();
    } catch (error) {
        return res.status(400).json({ error });
    }
  },
};