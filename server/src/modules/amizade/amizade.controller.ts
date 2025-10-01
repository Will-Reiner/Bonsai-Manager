import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { amizadeSchema } from './amizade.schema';

export const amizadeController = {
  // Cria uma nova relação de "seguir"
  follow: async (req: Request, res: Response) => {
    try {
      const seguidorId = req.user!.userId;
      const { seguidoId } = amizadeSchema.parse(req).params;

      if (seguidorId === seguidoId) {
        return res.status(400).json({ message: 'Não pode seguir a si mesmo.' });
      }

      // Verifica se o usuário a ser seguido existe
      const seguidoExists = await prisma.usuario.findUnique({ where: { id: seguidoId } });
      if (!seguidoExists) {
        return res.status(404).json({ message: 'Utilizador a ser seguido não encontrado.' });
      }

      // Verifica se a amizade já existe
      const amizadeExistente = await prisma.amizade.findUnique({
          where: { seguidorId_seguidoId: { seguidorId, seguidoId } }
      });

      if(amizadeExistente) {
          return res.status(409).json({ message: 'Já está a seguir este utilizador.' });
      }

      const novaAmizade = await prisma.amizade.create({
        data: {
          seguidorId,
          seguidoId,
        },
      });

      return res.status(201).json(novaAmizade);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Remove uma relação de "seguir"
  unfollow: async (req: Request, res: Response) => {
    try {
        const seguidorId = req.user!.userId;
        const { seguidoId } = amizadeSchema.parse(req).params;

        // Verifica se a amizade existe antes de apagar
        const amizadeExistente = await prisma.amizade.findUnique({
            where: { seguidorId_seguidoId: { seguidorId, seguidoId } }
        });

        if(!amizadeExistente) {
            return res.status(404).json({ message: 'Não está a seguir este utilizador.' });
        }

        await prisma.amizade.delete({
            where: {
                seguidorId_seguidoId: { seguidorId, seguidoId }
            }
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(400).json({ error });
    }
  },
};