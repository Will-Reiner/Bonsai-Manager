import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createGuiaSazonalSchema, updateGuiaSazonalSchema, GuiaSazonalIdSchema } from './guia-sazonal.schema';

export const guiaSazonalController = {
  // Cria uma nova entrada no guia sazonal
  create: async (req: Request, res: Response) => {
    try {
      const data = createGuiaSazonalSchema.parse(req).body;
      const novoGuia = await prisma.guiaSazonal.create({ data });
      return res.status(201).json(novoGuia);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualiza uma entrada existente
  update: async (req: Request, res: Response) => {
    try {
        const { especieId, atividadeId, estacao } = GuiaSazonalIdSchema.parse(req).params;
        const data = updateGuiaSazonalSchema.parse(req).body;

        const guiaAtualizado = await prisma.guiaSazonal.update({
            where: {
                especieId_atividadeId_estacao: { especieId, atividadeId, estacao }
            },
            data,
        });
        return res.status(200).json(guiaAtualizado);
    } catch (error) {
        return res.status(400).json({ error });
    }
  },

  // Apaga uma entrada
  delete: async (req: Request, res: Response) => {
    try {
        const { especieId, atividadeId, estacao } = GuiaSazonalIdSchema.parse(req).params;
        await prisma.guiaSazonal.delete({
            where: {
                especieId_atividadeId_estacao: { especieId, atividadeId, estacao }
            }
        });
        return res.status(204).send();
    } catch (error) {
        return res.status(400).json({ error });
    }
  },
};