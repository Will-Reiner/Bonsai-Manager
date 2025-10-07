import { Router } from 'express';
import { AtividadeFerramentaSugeridaController } from './atividade-ferramenta-sugerida.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const atividadeFerramentaSugeridaRouter = Router();
const atividadeFerramentaSugeridaController = new AtividadeFerramentaSugeridaController();

atividadeFerramentaSugeridaRouter.use(adminMiddleware);

atividadeFerramentaSugeridaRouter.post('/:atividadeId/:ferramentaId', atividadeFerramentaSugeridaController.create.bind(atividadeFerramentaSugeridaController));
atividadeFerramentaSugeridaRouter.delete('/:atividadeId/:ferramentaId', atividadeFerramentaSugeridaController.delete.bind(atividadeFerramentaSugeridaController));

export default atividadeFerramentaSugeridaRouter;