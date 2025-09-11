import { Router } from 'express';
import { fotoController } from './foto.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const fotoRouter = Router();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
fotoRouter.use(authMiddleware);

fotoRouter.post('/', fotoController.create);
fotoRouter.get('/planta/:plantaId', fotoController.getAllByPlanta);
fotoRouter.get('/:id', fotoController.getById);
fotoRouter.put('/:id', fotoController.update);
fotoRouter.delete('/:id', fotoController.delete);

export default fotoRouter;