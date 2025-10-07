import { Router } from 'express';
import { GuiaSazonalController } from './guia-sazonal.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();
const controller = new GuiaSazonalController();

router.post('/', adminMiddleware, controller.create);
router.put('/:especieId/:atividadeId/:estacao', adminMiddleware, controller.update);
router.delete('/:especieId/:atividadeId/:estacao', adminMiddleware, controller.delete);

export { router as guiaSazonalRouter };