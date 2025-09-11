import { Router } from 'express';
import { tipoRecursoController } from './tipo-recurso.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const tipoRecursoRouter = Router();

tipoRecursoRouter.get('/', tipoRecursoController.getAll);
tipoRecursoRouter.get('/:id', tipoRecursoController.getById);

// Apenas utilizadores logados podem modificar os tipos de recurso
tipoRecursoRouter.post('/', adminMiddleware, tipoRecursoController.create);
tipoRecursoRouter.put('/:id', adminMiddleware, tipoRecursoController.update);
tipoRecursoRouter.delete('/:id', adminMiddleware, tipoRecursoController.delete);

export default tipoRecursoRouter;