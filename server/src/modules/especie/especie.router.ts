import { Router } from 'express';
import { especieController } from './especie.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const especieRouter = Router();

// --- Rotas Públicas ---
// Qualquer pessoa (logada ou não) pode ver as espécies
especieRouter.get('/', especieController.getAll);
especieRouter.get('/:id', especieController.getById);

// --- Rotas Protegidas ---
// Apenas usuários logados podem criar, atualizar ou deletar espécies
especieRouter.post('/', authMiddleware, especieController.create);
especieRouter.put('/:id', authMiddleware, especieController.update);
especieRouter.delete('/:id', authMiddleware, especieController.delete);

export default especieRouter;
