import { Router } from 'express';
import { AgendaController } from './agenda.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rotinaController } from '../rotina/rotina.controller';

const agendaRouter = Router();
const agendaController = new AgendaController();

// Todas as operações da agenda exigem que o utilizador esteja logado
agendaRouter.use(authMiddleware);

agendaRouter.post('/', agendaController.create.bind(agendaController));
agendaRouter.get('/', agendaController.getAllByUser.bind(agendaController));
agendaRouter.post('/lote', agendaController.createLote.bind(agendaController));
agendaRouter.post('/concluir', agendaController.concluir.bind(agendaController));
agendaRouter.post('/registrar', agendaController.registrar.bind(agendaController));
agendaRouter.post('/:id/pular', rotinaController.pular);
agendaRouter.get('/:id', agendaController.getById.bind(agendaController));
agendaRouter.put('/:id', agendaController.update.bind(agendaController));
agendaRouter.delete('/:id', agendaController.delete.bind(agendaController));

export default agendaRouter;
