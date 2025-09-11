import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createPlantaSchema, updatePlantaSchema, plantaIdSchema } from './planta.schema';

export const plantaController = {
  // Criar uma nova planta para o utilizador logado
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createPlantaSchema.parse(req).body;

      const novaPlanta = await prisma.planta.create({
        data: {
          ...data,
          usuarioId, // Liga a planta ao utilizador logado
        },
      });

      return res.status(201).json(novaPlanta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Listar todas as plantas DO UTILIZADOR LOGADO
  getAllByUser: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const plantas = await prisma.planta.findMany({
        where: { usuarioId },
        include: { especie: true }, // Inclui os dados da espécie na resposta
      });
      return res.status(200).json(plantas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar plantas.' });
    }
  },

  // Obter uma planta específica, verificando se pertence ao utilizador
  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;

      const planta = await prisma.planta.findFirst({
        where: { id, usuarioId }, // A CONDIÇÃO DE SEGURANÇA!
        include: { especie: true },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      return res.status(200).json(planta);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualizar uma planta, verificando se pertence ao utilizador
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;
      const dataToUpdate = updatePlantaSchema.parse(req).body;

      // Primeiro, verifica se a planta existe e pertence ao utilizador
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

  // Apagar uma planta, verificando se pertence ao utilizador
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
