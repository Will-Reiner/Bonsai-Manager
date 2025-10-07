import { Request, Response } from 'express';
import { createAgendaSchema, updateAgendaSchema, agendaIdSchema } from './agenda.schema';
import { PrismaAgendaRepository } from './repositories/prisma-agenda.repository';
import {
  CreateAgendaUseCase,
  GetAllAgendasByUserUseCase,
  UpdateAgendaUseCase,
  DeleteAgendaUseCase,
} from './use-cases';
import { CreateAgendaDTO, UpdateAgendaDTO } from './agenda.types';
import '../../middlewares/auth.middleware'; // Import para garantir que a extensão da interface Request seja reconhecida

export class AgendaController {
  private createAgendaUseCase: CreateAgendaUseCase;
  private getAllAgendasByUserUseCase: GetAllAgendasByUserUseCase;
  private updateAgendaUseCase: UpdateAgendaUseCase;
  private deleteAgendaUseCase: DeleteAgendaUseCase;

  constructor() {
    const agendaRepository = new PrismaAgendaRepository();
    this.createAgendaUseCase = new CreateAgendaUseCase(agendaRepository);
    this.getAllAgendasByUserUseCase = new GetAllAgendasByUserUseCase(agendaRepository);
    this.updateAgendaUseCase = new UpdateAgendaUseCase(agendaRepository);
    this.deleteAgendaUseCase = new DeleteAgendaUseCase(agendaRepository);
  }

  async create(req: Request, res: Response) {
    try {
      const { body } = createAgendaSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agenda = await this.createAgendaUseCase.execute(body as CreateAgendaDTO, usuarioId);

      res.status(201).json(agenda);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      
      if (error instanceof Error && error.message === 'Acesso negado. A planta não pertence a si.') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAllByUser(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agendas = await this.getAllAgendasByUserUseCase.execute(usuarioId);

      res.json(agendas);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      const { body } = updateAgendaSchema.parse({ body: req.body, params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const updatedAgenda = await this.updateAgendaUseCase.execute(params.id, body as UpdateAgendaDTO, usuarioId);

      res.json(updatedAgenda);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await this.deleteAgendaUseCase.execute(params.id, usuarioId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}