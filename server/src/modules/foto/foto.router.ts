import { Router } from 'express';
import { FotoController } from './foto.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../config/upload';

const fotoRouter = Router();
const fotoController = new FotoController();

// APLICA O MIDDLEWARE A TODAS AS ROTAS DESTE ROTEADOR
fotoRouter.use(authMiddleware);

fotoRouter.post('/upload', upload.single('foto'), fotoController.upload.bind(fotoController));
fotoRouter.post('/', fotoController.create.bind(fotoController));
fotoRouter.get('/planta/:plantaId', fotoController.getAllByPlanta.bind(fotoController));
fotoRouter.get('/:id', fotoController.getById.bind(fotoController));
fotoRouter.put('/:id', fotoController.update.bind(fotoController));
fotoRouter.delete('/:id', fotoController.delete.bind(fotoController));

export default fotoRouter;