import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { AtividadeRecursoController } from './atividade-recurso.controller';

const router = Router();
const atividadeRecursoController = new AtividadeRecursoController();

// Criar associação entre atividade e tipo de recurso
router.post('/', authMiddleware, atividadeRecursoController.create.bind(atividadeRecursoController));

// Listar tipos de recursos por atividade
router.get('/atividade/:atividadeId', authMiddleware, atividadeRecursoController.getByAtividade.bind(atividadeRecursoController));

// Listar atividades por tipo de recurso
router.get('/tipo-recurso/:tipoRecursoId', authMiddleware, atividadeRecursoController.getByTipoRecurso.bind(atividadeRecursoController));

// Remover associação entre atividade e tipo de recurso
router.delete('/:atividadeId/:tipoRecursoId', authMiddleware, atividadeRecursoController.delete.bind(atividadeRecursoController));

export { router as atividadeRecursoRouter };