import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createPlantaSchema, updatePlantaSchema, plantaIdSchema } from './planta.schema';

export const plantaController = {
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createPlantaSchema.parse(req).body;

      const novaPlanta = await prisma.planta.create({
        data: {
          ...data,
          usuarioId,
        },
      });

      return res.status(201).json(novaPlanta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  getAllByUser: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const plantas = await prisma.planta.findMany({
        where: { usuarioId },
        include: { especie: true },
      });
      return res.status(200).json(plantas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar plantas.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;

      const planta = await prisma.planta.findFirst({
        where: { id, usuarioId },
        include: { 
            especie: true,
            // Podemos incluir inspirações no futuro, se necessário
            // inspiracoes: { include: { foto: true } } 
        },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      return res.status(200).json(planta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;
      const dataToUpdate = updatePlantaSchema.parse(req).body;

      const plantaExistente = await prisma.planta.findFirst({ where: { id, usuarioId } });
      if (!plantaExistente) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const plantaAtualizada = await prisma.planta.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(plantaAtualizada);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;

      const plantaExistente = await prisma.planta.findFirst({ where: { id, usuarioId } });
      if (!plantaExistente) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      await prisma.planta.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};