import { Router } from 'express';
import { AtividadeRecursoSugeridoController } from './atividade-recurso-sugerido.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();
const atividadeRecursoSugeridoController = new AtividadeRecursoSugeridoController();

// Rota pública
router.get('/atividade/:atividadeId', atividadeRecursoSugeridoController.getByAtividade.bind(atividadeRecursoSugeridoController));

// Rotas protegidas (admin)
router.post('/:atividadeId/:tipoRecursoId', adminMiddleware, atividadeRecursoSugeridoController.create.bind(atividadeRecursoSugeridoController));
router.delete('/:atividadeId/:tipoRecursoId', adminMiddleware, atividadeRecursoSugeridoController.delete.bind(atividadeRecursoSugeridoController));

export { router as atividadeRecursoSugeridoRouter };