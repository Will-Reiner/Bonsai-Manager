import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createFotoSchema, updateFotoSchema, fotoIdSchema, plantaIdSchema } from './foto.schema';

export const fotoController = {
  // Criar uma nova foto
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createFotoSchema.parse(req).body;

      // Verificar se a planta pertence ao usuário logado
      const planta = await prisma.planta.findFirst({
        where: { id: data.plantaId, usuarioId },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const novaFoto = await prisma.foto.create({
        data,
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

      // Verificar se a planta pertence ao usuário logado
      const planta = await prisma.planta.findFirst({
        where: { id: plantaId, usuarioId },
      });

      if (!planta) {
        return res.status(404).json({ message: 'Planta não encontrada ou não pertence a si.' });
      }

      const fotos = await prisma.foto.findMany({
        where: { plantaId },
        orderBy: { dataUpload: 'desc' },
      });

      return res.status(200).json(fotos);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Obter uma foto específica
  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = fotoIdSchema.parse(req).params;

      const foto = await prisma.foto.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!foto) {
        return res.status(404).json({ message: 'Foto não encontrada.' });
      }

      // Verificar se a planta da foto pertence ao usuário logado
      if (foto.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a esta foto.' });
      }

      return res.status(200).json(foto);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualizar uma foto
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = updateFotoSchema.parse(req).params;
      const dataToUpdate = updateFotoSchema.parse(req).body;

      // Buscar a foto e verificar se a planta pertence ao usuário
      const foto = await prisma.foto.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!foto) {
        return res.status(404).json({ message: 'Foto não encontrada.' });
      }

      if (foto.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a esta foto.' });
      }

      // Se estiver atualizando a plantaId, verificar se a nova planta também pertence ao usuário
      if (dataToUpdate.plantaId && dataToUpdate.plantaId !== foto.plantaId) {
        const novaPlanta = await prisma.planta.findFirst({
          where: { id: dataToUpdate.plantaId, usuarioId },
        });

        if (!novaPlanta) {
          return res.status(404).json({ message: 'Nova planta não encontrada ou não pertence a si.' });
        }
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

  // Apagar uma foto
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = fotoIdSchema.parse(req).params;

      // Buscar a foto e verificar se a planta pertence ao usuário
      const foto = await prisma.foto.findUnique({
        where: { id },
        include: { planta: true },
      });

      if (!foto) {
        return res.status(404).json({ message: 'Foto não encontrada.' });
      }

      if (foto.planta.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Acesso negado a esta foto.' });
      }

      await prisma.foto.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};