import { Router } from 'express';
import { guiaSazonalController } from './guia-sazonal.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const guiaSazonalRouter = Router();

// Todas as operações neste módulo exigem privilégios de administrador
guiaSazonalRouter.use(adminMiddleware);

guiaSazonalRouter.post('/', guiaSazonalController.create);
guiaSazonalRouter.put('/:especieId/:atividadeId/:estacao', guiaSazonalController.update);
guiaSazonalRouter.delete('/:especieId/:atividadeId/:estacao', guiaSazonalController.delete);

export default guiaSazonalRouter;