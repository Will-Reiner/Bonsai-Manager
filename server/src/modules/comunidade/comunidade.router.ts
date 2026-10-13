import { Router } from 'express';
import { comunidadeController } from './comunidade.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const comunidadeRouter = Router();
comunidadeRouter.use(authMiddleware);

comunidadeRouter.get('/feed', comunidadeController.feed);
comunidadeRouter.get('/posts/:id', comunidadeController.post);
comunidadeRouter.get('/usuarios/:id', comunidadeController.perfil);
comunidadeRouter.get('/usuarios/:id/posts', comunidadeController.postsDoPerfil);
comunidadeRouter.get('/plantas/:id', comunidadeController.planta);
comunidadeRouter.get('/buscar', comunidadeController.buscar);

export default comunidadeRouter;
