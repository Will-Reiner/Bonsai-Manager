import { Router } from 'express';
import { AtividadeFerramentaSugeridaController } from './atividade-ferramenta-sugerida.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const atividadeFerramentaSugeridaRouter = Router();
const atividadeFerramentaSugeridaController = new AtividadeFerramentaSugeridaController();

// Rota pública
atividadeFerramentaSugeridaRouter.get('/atividade/:atividadeId', atividadeFerramentaSugeridaController.getByAtividade.bind(atividadeFerramentaSugeridaController));

// Rotas protegidas (admin)
atividadeFerramentaSugeridaRouter.post('/:atividadeId/:ferramentaId', adminMiddleware, atividadeFerramentaSugeridaController.create.bind(atividadeFerramentaSugeridaController));
atividadeFerramentaSugeridaRouter.delete('/:atividadeId/:ferramentaId', adminMiddleware, atividadeFerramentaSugeridaController.delete.bind(atividadeFerramentaSugeridaController));

export default atividadeFerramentaSugeridaRouter;