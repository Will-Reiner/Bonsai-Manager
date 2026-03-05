import { Router } from 'express';
import { AgendaController } from './agenda.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const agendaRouter = Router();
const agendaController = new AgendaController();

// Todas as operações da agenda exigem que o utilizador esteja logado
agendaRouter.use(authMiddleware);

agendaRouter.post('/', agendaController.create.bind(agendaController));
agendaRouter.get('/', agendaController.getAllByUser.bind(agendaController));
agendaRouter.get('/:id', agendaController.getById.bind(agendaController));
agendaRouter.put('/:id', agendaController.update.bind(agendaController));
agendaRouter.delete('/:id', agendaController.delete.bind(agendaController));

export default agendaRouter;
