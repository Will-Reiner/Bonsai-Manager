import { Router } from 'express';
import { RecursoController } from './recurso.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const recursoRouter = Router();
const recursoController = new RecursoController();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
recursoRouter.use(authMiddleware);

recursoRouter.post('/', recursoController.create.bind(recursoController));
recursoRouter.get('/', recursoController.getAllByUser.bind(recursoController));
recursoRouter.get('/:id', recursoController.getById.bind(recursoController));
recursoRouter.put('/:id', recursoController.update.bind(recursoController));
recursoRouter.delete('/:id', recursoController.delete.bind(recursoController));

export default recursoRouter;