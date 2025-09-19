import { Router } from 'express';
import { amizadeController } from './amizade.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const amizadeRouter = Router();

// Todas as operações neste módulo exigem que o usuário esteja autenticado
amizadeRouter.use(authMiddleware);

amizadeRouter.post('/follow/:seguidoId', amizadeController.follow);
amizadeRouter.delete('/unfollow/:seguidoId', amizadeController.unfollow);

export default amizadeRouter;