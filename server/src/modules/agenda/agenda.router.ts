import { Router } from 'express';
import { agendaController } from './agenda.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const agendaRouter = Router();

// Todas as operações da agenda exigem que o utilizador esteja logado
agendaRouter.use(authMiddleware);

agendaRouter.post('/', agendaController.create);
agendaRouter.get('/', agendaController.getAllByUser);
agendaRouter.put('/:id', agendaController.update);
agendaRouter.delete('/:id', agendaController.delete);

export default agendaRouter;
