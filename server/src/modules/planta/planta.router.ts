import { Router } from 'express';
import { plantaController } from './planta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const plantaRouter = Router();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
plantaRouter.use(authMiddleware);

plantaRouter.post('/', plantaController.create);
plantaRouter.get('/', plantaController.getAllByUser);
plantaRouter.get('/:id', plantaController.getById);
plantaRouter.put('/:id', plantaController.update);
plantaRouter.delete('/:id', plantaController.delete);

export default plantaRouter;
