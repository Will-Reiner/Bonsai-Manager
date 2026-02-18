import { Router } from 'express';
import { GuiaDeTecnicasController } from './guia-de-tecnicas.controller';
import { adminMiddleware } from '../../middlewares/admin.middleware';

const router = Router();
const controller = new GuiaDeTecnicasController();

// Rotas públicas
router.get('/', controller.getAll);
router.get('/especie/:especieId', controller.getByEspecie);

// Rotas protegidas (admin)
router.post('/', adminMiddleware, controller.create);
router.put('/:especieId/:atividadeId', adminMiddleware, controller.update);
router.delete('/:especieId/:atividadeId', adminMiddleware, controller.delete);

export { router as guiaDeTecnicasRouter };