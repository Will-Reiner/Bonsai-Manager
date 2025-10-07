import { Request, Response } from 'express';
import { createFerramentaSchema, updateFerramentaSchema, ferramentaIdSchema } from './ferramenta.schema';
import { PrismaFerramentaRepository } from './repositories/prisma-ferramenta.repository';
import {
  CreateFerramentaUseCase,
  GetAllFerramentasUseCase,
  GetFerramentaByIdUseCase,
  UpdateFerramentaUseCase,
  DeleteFerramentaUseCase
} from './use-cases';

export class FerramentaController {
  private ferramentaRepository = new PrismaFerramentaRepository();
  private createFerramentaUseCase = new CreateFerramentaUseCase(this.ferramentaRepository);
  private getAllFerramentasUseCase = new GetAllFerramentasUseCase(this.ferramentaRepository);
  private getFerramentaByIdUseCase = new GetFerramentaByIdUseCase(this.ferramentaRepository);
  private updateFerramentaUseCase = new UpdateFerramentaUseCase(this.ferramentaRepository);
  private deleteFerramentaUseCase = new DeleteFerramentaUseCase(this.ferramentaRepository);

  async create(req: Request, res: Response) {
    try {
      const { body } = createFerramentaSchema.parse(req);
      const ferramenta = await this.createFerramentaUseCase.execute(body);
      res.status(201).json(ferramenta);
    } catch (error) {
      if (error instanceof Error && error.message === 'Já existe uma ferramenta com este nome.') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro ao criar ferramenta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const ferramentas = await this.getAllFerramentasUseCase.execute();
      res.json(ferramentas);
    } catch (error) {
      console.error('Erro ao buscar ferramentas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { params } = ferramentaIdSchema.parse(req);
      const ferramenta = await this.getFerramentaByIdUseCase.execute(params.id);
      res.json(ferramenta);
    } catch (error) {
      if (error instanceof Error && error.message === 'Ferramenta não encontrada.') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao buscar ferramenta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { params, body } = updateFerramentaSchema.parse(req);
      const ferramenta = await this.updateFerramentaUseCase.execute(params.id, body);
      res.json(ferramenta);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Ferramenta não encontrada.') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Já existe uma ferramenta com este nome.') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Erro ao atualizar ferramenta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { params } = ferramentaIdSchema.parse(req);
      await this.deleteFerramentaUseCase.execute(params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Ferramenta não encontrada.') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Erro ao deletar ferramenta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}