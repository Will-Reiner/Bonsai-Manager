import { Router } from 'express';
import { atividadeRecursoSugeridoController } from './atividade-recurso-sugerido.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const atividadeRecursoSugeridoRouter = Router();
atividadeRecursoSugeridoRouter.use(adminMiddleware);

atividadeRecursoSugeridoRouter.post('/:atividadeId/:tipoRecursoId', atividadeRecursoSugeridoController.create);
atividadeRecursoSugeridoRouter.delete('/:atividadeId/:tipoRecursoId', atividadeRecursoSugeridoController.delete);

export default atividadeRecursoSugeridoRouter;