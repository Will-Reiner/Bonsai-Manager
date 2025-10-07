import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { amizadeSchema } from './amizade.schema';
import { PrismaAmizadeRepository } from './repositories/prisma-amizade.repository';
import { FollowUserUseCase, UnfollowUserUseCase } from './use-cases';

export class AmizadeController {
  private amizadeRepository = new PrismaAmizadeRepository();
  private followUserUseCase = new FollowUserUseCase(this.amizadeRepository);
  private unfollowUserUseCase = new UnfollowUserUseCase(this.amizadeRepository);

  async follow(req: Request, res: Response) {
    try {
      const seguidorId = req.user!.userId;
      const { params } = amizadeSchema.parse(req);
      
      const amizade = await this.followUserUseCase.execute({
        seguidorId,
        seguidoId: params.seguidoId,
      });

      res.status(201).json(amizade);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Não pode seguir a si mesmo.') {
          return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Utilizador a ser seguido não encontrado.') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Já está a seguir este utilizador.') {
          return res.status(409).json({ message: error.message });
        }
      }
      console.error('Erro ao seguir usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async unfollow(req: Request, res: Response) {
    try {
      const seguidorId = req.user!.userId;
      const { params } = amizadeSchema.parse(req);

      await this.unfollowUserUseCase.execute({
        seguidorId,
        seguidoId: params.seguidoId,
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Não está a seguir este utilizador.') {
        return res.status(404).json({ message: error.message });
      }
      console.error('Erro ao deixar de seguir usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}