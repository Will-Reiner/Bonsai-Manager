import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rotinaController } from './rotina.controller';

const rotinaRouter = Router();
rotinaRouter.use(authMiddleware);

rotinaRouter.get('/', rotinaController.listar);
rotinaRouter.post('/', rotinaController.criar);
rotinaRouter.put('/:id', rotinaController.atualizar);
rotinaRouter.delete('/:id', rotinaController.apagar);
rotinaRouter.post('/:id/pausar', rotinaController.pausar);
rotinaRouter.post('/:id/retomar', rotinaController.retomar);

export default rotinaRouter;
