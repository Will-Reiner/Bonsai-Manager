import { Router } from 'express';
import { especieController } from './especie.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';

const especieRouter = Router();

// --- Rotas Públicas ---
especieRouter.get('/', especieController.getAll);

// --- Rotas de Admin ---
// IMPORTANTE: /sugeridas deve vir ANTES de /:id para não ser interpretado como ID
especieRouter.get('/sugeridas', adminMiddleware, especieController.getSugeridas);

// --- Rotas Públicas (com parâmetro) ---
especieRouter.get('/:id', especieController.getById);

// --- Rotas Protegidas ---
especieRouter.post('/', authMiddleware, especieController.create);
especieRouter.put('/:id', authMiddleware, especieController.update);
especieRouter.delete('/:id', adminMiddleware, especieController.delete);

export default especieRouter;
