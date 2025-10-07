import { Router } from 'express';
import { InspiracaoController } from './inspiracao.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new InspiracaoController();

router.post('/:plantaId/:fotoId', authMiddleware, controller.add);
router.delete('/:plantaId/:fotoId', authMiddleware, controller.remove);

export { router as inspiracaoRouter };