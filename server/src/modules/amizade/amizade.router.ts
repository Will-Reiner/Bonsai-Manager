import { Router } from 'express';
import { AmizadeController } from './amizade.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const amizadeRouter = Router();
const amizadeController = new AmizadeController();

// Todas as operações neste módulo exigem que o usuário esteja autenticado
amizadeRouter.use(authMiddleware);

amizadeRouter.get('/seguidores', amizadeController.getSeguidores.bind(amizadeController));
amizadeRouter.get('/seguindo', amizadeController.getSeguindo.bind(amizadeController));
amizadeRouter.post('/follow/:seguidoId', amizadeController.follow.bind(amizadeController));
amizadeRouter.delete('/unfollow/:seguidoId', amizadeController.unfollow.bind(amizadeController));

export default amizadeRouter;