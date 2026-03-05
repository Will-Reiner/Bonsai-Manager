import { Router } from 'express';
import { FerramentaController } from './ferramenta.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';

const ferramentaRouter = Router();
const ferramentaController = new FerramentaController();

// Rotas públicas para visualização
ferramentaRouter.get('/', ferramentaController.getAll.bind(ferramentaController));
ferramentaRouter.get('/:id', ferramentaController.getById.bind(ferramentaController));

// Rotas protegidas para administradores
ferramentaRouter.post('/', adminMiddleware, ferramentaController.create.bind(ferramentaController));
ferramentaRouter.put('/:id', adminMiddleware, ferramentaController.update.bind(ferramentaController));
ferramentaRouter.delete('/:id', adminMiddleware, ferramentaController.delete.bind(ferramentaController));

export default ferramentaRouter;