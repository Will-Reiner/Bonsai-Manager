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
comunidadeRouter.post('/posts/:id/curtida', comunidadeController.curtir);
comunidadeRouter.delete('/posts/:id/curtida', comunidadeController.descurtir);
comunidadeRouter.post('/posts/:id/salvo', comunidadeController.salvar);
comunidadeRouter.delete('/posts/:id/salvo', comunidadeController.dessalvar);
comunidadeRouter.get('/posts/:id/comentarios', comunidadeController.comentarios);
comunidadeRouter.post('/posts/:id/comentarios', comunidadeController.comentar);
comunidadeRouter.delete('/comentarios/:id', comunidadeController.apagarComentario);
comunidadeRouter.get('/salvos', comunidadeController.salvos);
comunidadeRouter.get('/notificacoes', comunidadeController.notificacoes);
comunidadeRouter.get('/notificacoes/nao-lidas', comunidadeController.naoLidas);
comunidadeRouter.post('/notificacoes/lidas', comunidadeController.marcarLidas);

export default comunidadeRouter;
