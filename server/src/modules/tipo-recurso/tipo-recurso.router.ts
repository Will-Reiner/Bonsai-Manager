import { Router } from 'express';
import { TipoRecursoController } from './tipo-recurso.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const tipoRecursoRouter = Router();
const tipoRecursoController = new TipoRecursoController();

tipoRecursoRouter.get('/', tipoRecursoController.getAll.bind(tipoRecursoController));
tipoRecursoRouter.get('/:id', tipoRecursoController.getById.bind(tipoRecursoController));

// Apenas utilizadores logados podem modificar os tipos de recurso
tipoRecursoRouter.post('/', adminMiddleware, tipoRecursoController.create.bind(tipoRecursoController));
tipoRecursoRouter.put('/:id', adminMiddleware, tipoRecursoController.update.bind(tipoRecursoController));
tipoRecursoRouter.delete('/:id', adminMiddleware, tipoRecursoController.delete.bind(tipoRecursoController));

export default tipoRecursoRouter;