import { Router } from 'express';
import { guiaDeTecnicasController } from './guia-de-tecnicas.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const guiaDeTecnicasRouter = Router();

// Todas as operações neste módulo exigem privilégios de administrador
guiaDeTecnicasRouter.use(adminMiddleware);

guiaDeTecnicasRouter.post('/', guiaDeTecnicasController.create);
guiaDeTecnicasRouter.put('/:especieId/:atividadeId', guiaDeTecnicasController.update);
guiaDeTecnicasRouter.delete('/:especieId/:atividadeId', guiaDeTecnicasController.delete);

export default guiaDeTecnicasRouter;