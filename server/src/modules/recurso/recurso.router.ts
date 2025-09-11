import { Router } from 'express';
import { recursoController } from './recurso.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const recursoRouter = Router();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
recursoRouter.use(authMiddleware);

recursoRouter.post('/', recursoController.create);
recursoRouter.get('/', recursoController.getAllByUser);
recursoRouter.get('/:id', recursoController.getById);
recursoRouter.put('/:id', recursoController.update);
recursoRouter.delete('/:id', recursoController.delete);

export default recursoRouter;