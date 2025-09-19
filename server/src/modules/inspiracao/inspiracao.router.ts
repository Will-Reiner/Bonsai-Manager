import { Router } from 'express';
import { inspiracaoController } from './inspiracao.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const inspiracaoRouter = Router();

// Todas as operações neste módulo exigem que o usuário esteja autenticado
inspiracaoRouter.use(authMiddleware);

inspiracaoRouter.post('/:plantaId/:fotoId', inspiracaoController.add);
inspiracaoRouter.delete('/:plantaId/:fotoId', inspiracaoController.remove);

export default inspiracaoRouter;