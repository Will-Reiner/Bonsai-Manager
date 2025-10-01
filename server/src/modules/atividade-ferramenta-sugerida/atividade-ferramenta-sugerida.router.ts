import { Router } from 'express';
import { atividadeFerramentaSugeridaController } from './atividade-ferramenta-sugerida.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const atividadeFerramentaSugeridaRouter = Router();
atividadeFerramentaSugeridaRouter.use(adminMiddleware);

atividadeFerramentaSugeridaRouter.post('/:atividadeId/:ferramentaId', atividadeFerramentaSugeridaController.create);
atividadeFerramentaSugeridaRouter.delete('/:atividadeId/:ferramentaId', atividadeFerramentaSugeridaController.delete);

export default atividadeFerramentaSugeridaRouter;