import { Router } from 'express';
import { atividadeRecursoController } from './atividade-recurso.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const atividadeRecursoRouter = Router();

// Aplicar middleware de autenticação em todas as rotas
atividadeRecursoRouter.use(authMiddleware);

// Rotas para gerenciar associações entre atividades e tipos de recursos
atividadeRecursoRouter.post('/', atividadeRecursoController.create);
atividadeRecursoRouter.get('/atividade/:atividadeId', atividadeRecursoController.getByAtividade);
atividadeRecursoRouter.get('/tipo-recurso/:tipoRecursoId', atividadeRecursoController.getByTipoRecurso);
atividadeRecursoRouter.delete('/:atividadeId/:tipoRecursoId', atividadeRecursoController.delete);

export { atividadeRecursoRouter };