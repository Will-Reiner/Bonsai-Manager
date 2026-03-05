import { Request, Response } from 'express';
import { createTipoRecursoSchema, updateTipoRecursoSchema, tipoRecursoIdSchema } from './tipo-recurso.schema';
import { PrismaTipoRecursoRepository } from './repositories/prisma-tipo-recurso.repository';
import {
  CreateTipoRecursoUseCase,
  GetAllTiposRecursoUseCase,
  GetTipoRecursoByIdUseCase,
  UpdateTipoRecursoUseCase,
  DeleteTipoRecursoUseCase
} from './use-cases';

export class TipoRecursoController {
  private tipoRecursoRepository = new PrismaTipoRecursoRepository();
  private createTipoRecursoUseCase = new CreateTipoRecursoUseCase(this.tipoRecursoRepository);
  private getAllTiposRecursoUseCase = new GetAllTiposRecursoUseCase(this.tipoRecursoRepository);
  private getTipoRecursoByIdUseCase = new GetTipoRecursoByIdUseCase(this.tipoRecursoRepository);
  private updateTipoRecursoUseCase = new UpdateTipoRecursoUseCase(this.tipoRecursoRepository);
  private deleteTipoRecursoUseCase = new DeleteTipoRecursoUseCase(this.tipoRecursoRepository);

  async create(req: Request, res: Response) {
    try {
      const { body } = createTipoRecursoSchema.parse(req);
      const tipoRecurso = await this.createTipoRecursoUseCase.execute(body);
      res.status(201).json(tipoRecurso);
    } catch (error) {
      if (error instanceof Error && error.message === 'Já existe um tipo de recurso com este nome.') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro ao criar tipo de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const tiposRecurso = await this.getAllTiposRecursoUseCase.execute();
      res.json(tiposRecurso);
    } catch (error) {
      console.error('Erro ao buscar tipos de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { params } = tipoRecursoIdSchema.parse(req);
      const tipoRecurso = await this.getTipoRecursoByIdUseCase.execute(params.id);
      res.json(tipoRecurso);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tipo de recurso não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao buscar tipo de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { params, body } = updateTipoRecursoSchema.parse(req);
      const tipoRecurso = await this.updateTipoRecursoUseCase.execute(params.id, body);
      res.json(tipoRecurso);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Tipo de recurso não encontrado.') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Já existe um tipo de recurso com este nome.') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Erro ao atualizar tipo de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { params } = tipoRecursoIdSchema.parse(req);
      await this.deleteTipoRecursoUseCase.execute(params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Tipo de recurso não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao deletar tipo de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}