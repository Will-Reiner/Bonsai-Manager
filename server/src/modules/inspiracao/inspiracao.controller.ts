import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { inspiracaoSchema } from './inspiracao.schema';

export const inspiracaoController = {
  // Adiciona uma foto como inspiração para uma planta
  add: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { plantaId, fotoId } = inspiracaoSchema.parse(req).params;

      // 1. Verificar se a planta pertence ao utilizador logado
      const planta = await prisma.planta.findFirst({
        where: { id: plantaId, usuarioId },
      });
      if (!planta) {
        return res.status(404).json({ message: 'A sua planta não foi encontrada.' });
      }

      // 2. Verificar se a foto existe e se pode ser usada como inspiração
      const foto = await prisma.foto.findUnique({
        where: { id: fotoId },
        include: { planta: true }, // Inclui a planta da foto para verificar a privacidade
      });

      if (!foto) {
        return res.status(404).json({ message: 'A foto de inspiração não foi encontrada.' });
      }

      // Uma foto pode ser inspiração se:
      // - For uma foto genérica (sem planta associada)
      // - A planta associada à foto for pública
      // - A foto pertence ao próprio utilizador
      const podeSerInspiracao = !foto.plantaId || foto.planta?.plantaPublica || foto.usuarioId === usuarioId;

      if (!podeSerInspiracao) {
          return res.status(403).json({ message: 'Não pode usar esta foto como inspiração.' });
      }

      const novaInspiracao = await prisma.inspiracao.create({
        data: { plantaId, fotoId },
      });

      return res.status(201).json(novaInspiracao);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Remove uma foto das inspirações de uma planta
  remove: async (req: Request, res: Response) => {
    try {
        const usuarioId = req.user!.userId;
        const { plantaId, fotoId } = inspiracaoSchema.parse(req).params;

        // Para remover, basta verificar se o utilizador é dono da planta
        // e se a inspiração existe.
        const inspiracao = await prisma.inspiracao.findFirst({
            where: {
                plantaId,
                fotoId,
                planta: {
                    usuarioId: usuarioId,
                },
            },
        });

        if (!inspiracao) {
            return res.status(404).json({ message: 'Ligação de inspiração não encontrada.' });
        }

        await prisma.inspiracao.delete({
            where: {
                plantaId_fotoId: { plantaId, fotoId }
            }
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(400).json({ error });
    }
  },
};