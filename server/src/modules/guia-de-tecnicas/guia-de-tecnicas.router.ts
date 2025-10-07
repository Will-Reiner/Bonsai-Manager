import { Router } from 'express';
import { GuiaDeTecnicasController } from './guia-de-tecnicas.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();
const controller = new GuiaDeTecnicasController();

router.post('/', adminMiddleware, controller.create);
router.put('/:especieId/:atividadeId', adminMiddleware, controller.update);
router.delete('/:especieId/:atividadeId', adminMiddleware, controller.delete);

export { router as guiaDeTecnicasRouter };