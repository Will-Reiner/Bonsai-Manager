import { Router } from 'express';
import { ferramentaController } from './ferramenta.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';

const ferramentaRouter = Router();

// Rotas públicas para visualização
ferramentaRouter.get('/', ferramentaController.getAll);
ferramentaRouter.get('/:id', ferramentaController.getById);

// Rotas protegidas para administradores
ferramentaRouter.post('/', adminMiddleware, ferramentaController.create);
ferramentaRouter.put('/:id', adminMiddleware, ferramentaController.update);
ferramentaRouter.delete('/:id', adminMiddleware, ferramentaController.delete);

export default ferramentaRouter;