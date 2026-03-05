import { Router } from 'express';
import { preferenciaController } from './preferencia.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const preferenciaRouter = Router();

// Todas as rotas são protegidas
preferenciaRouter.use(authMiddleware);

preferenciaRouter.get('/', preferenciaController.getAll);
preferenciaRouter.put('/', preferenciaController.upsertEmLote);
preferenciaRouter.put('/:chave', preferenciaController.upsert);

export default preferenciaRouter;
