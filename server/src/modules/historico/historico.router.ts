import { Router } from 'express';
import { historicoController } from './historico.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const historicoRouter = Router();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
historicoRouter.use(authMiddleware);

historicoRouter.post('/', historicoController.create);
historicoRouter.get('/planta/:plantaId', historicoController.getAllByPlanta);
historicoRouter.get('/:id', historicoController.getById);
historicoRouter.put('/:id', historicoController.update);
historicoRouter.delete('/:id', historicoController.delete);

export default historicoRouter;