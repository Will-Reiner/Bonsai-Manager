import { Router } from 'express';
import { tipoRecursoController } from './tipo-recurso.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const tipoRecursoRouter = Router();

tipoRecursoRouter.get('/', tipoRecursoController.getAll);
tipoRecursoRouter.get('/:id', tipoRecursoController.getById);

// Apenas utilizadores logados podem modificar os tipos de recurso
tipoRecursoRouter.post('/', authMiddleware, tipoRecursoController.create);
tipoRecursoRouter.put('/:id', authMiddleware, tipoRecursoController.update);
tipoRecursoRouter.delete('/:id', authMiddleware, tipoRecursoController.delete);

export default tipoRecursoRouter;