import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createFotoSchema, updateFotoSchema, fotoIdSchema, plantaIdSchema } from './foto.schema';

export const fotoController = {
  // Criar uma nova foto para o usuário logado
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createFotoSchema.parse(req).body;

      // Se um plantaId for fornecido, verifique se a planta pertence ao usuário
      if (data.plantaId) {
        const planta = await prisma.planta.findFirst({
          where: { id: data.plantaId, usuarioId },
        });
        if (!planta) {
          return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
        }
      }

      const novaFoto = await prisma.foto.create({
        data: {
          ...data,
          usuarioId, // Associa a foto ao usuário logado
        },
      });

      return res.status(201).json(novaFoto);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Listar todas as fotos de uma planta específica
  getAllByPlanta: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId } = plantaIdSchema.parse(req).params;

      // Verificar se a planta pertence ao usuário para permitir o acesso
      const planta = await prisma.planta.findFirst({
        where: { id: plantaId, usuarioId },
      });
      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const fotos = await prisma.foto.findMany({
        where: { plantaId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(fotos);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Obter uma foto específica (verificando a posse da foto)
  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = fotoIdSchema.parse(req).params;

      const foto = await prisma.foto.findFirst({
        where: { id, usuarioId }, // Verifica se a foto pertence ao usuário
      });

      if (!foto) {
        return res.status(404).json({ message: 'Foto não encontrada ou não pertence a si.' });
      }

      return res.status(200).json(foto);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualizar uma foto (verificando a posse da foto)
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = updateFotoSchema.parse(req).params;
      const dataToUpdate = updateFotoSchema.parse(req).body;

      // Verifica se a foto existe e pertence ao usuário
      const fotoExistente = await prisma.foto.findFirst({ where: { id, usuarioId } });
      if (!fotoExistente) {
        return res.status(404).json({ message: 'Foto não encontrada ou não pertence a si.' });
      }

      const fotoAtualizada = await prisma.foto.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(fotoAtualizada);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apagar uma foto (verificando a posse da foto)
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = fotoIdSchema.parse(req).params;

      const fotoExistente = await prisma.foto.findFirst({ where: { id, usuarioId } });
      if (!fotoExistente) {
        return res.status(404).json({ message: 'Foto não encontrada ou não pertence a si.' });
      }

      await prisma.foto.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};