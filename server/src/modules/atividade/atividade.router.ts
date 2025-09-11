import { Router } from 'express';
import { atividadeController } from './atividade.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const atividadeRouter = Router();

atividadeRouter.get('/', atividadeController.getAll);
atividadeRouter.get('/:id', atividadeController.getById);

// Apenas utilizadores logados (idealmente, administradores no futuro) podem modificar as atividades
atividadeRouter.post('/', authMiddleware, atividadeController.create);
atividadeRouter.put('/:id', authMiddleware, atividadeController.update);
atividadeRouter.delete('/:id', authMiddleware, atividadeController.delete);

export default atividadeRouter;
