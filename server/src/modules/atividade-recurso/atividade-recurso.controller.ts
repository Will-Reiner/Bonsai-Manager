import { Request, Response } from 'express';
import { 
  createAtividadeRecursoSchema, 
  atividadeRecursoIdSchema, 
  atividadeIdSchema,
  tipoRecursoIdSchema
} from './atividade-recurso.schema';
import { PrismaAtividadeRecursoRepository } from './repositories/prisma-atividade-recurso.repository';
import {
  CreateAtividadeRecursoUseCase,
  GetRecursosByAtividadeUseCase,
  GetAtividadesByTipoRecursoUseCase,
  DeleteAtividadeRecursoUseCase,
} from './use-cases';

export class AtividadeRecursoController {
  private atividadeRecursoRepository: PrismaAtividadeRecursoRepository;
  private createAtividadeRecursoUseCase: CreateAtividadeRecursoUseCase;
  private getRecursosByAtividadeUseCase: GetRecursosByAtividadeUseCase;
  private getAtividadesByTipoRecursoUseCase: GetAtividadesByTipoRecursoUseCase;
  private deleteAtividadeRecursoUseCase: DeleteAtividadeRecursoUseCase;

  constructor() {
    this.atividadeRecursoRepository = new PrismaAtividadeRecursoRepository();
    this.createAtividadeRecursoUseCase = new CreateAtividadeRecursoUseCase(
      this.atividadeRecursoRepository
    );
    this.getRecursosByAtividadeUseCase = new GetRecursosByAtividadeUseCase(
      this.atividadeRecursoRepository
    );
    this.getAtividadesByTipoRecursoUseCase = new GetAtividadesByTipoRecursoUseCase(
      this.atividadeRecursoRepository
    );
    this.deleteAtividadeRecursoUseCase = new DeleteAtividadeRecursoUseCase(
      this.atividadeRecursoRepository
    );
  }

  // Associar um tipo de recurso a uma atividade
  async create(req: Request, res: Response) {
    try {
      const { body } = createAtividadeRecursoSchema.parse(req);
      
      const novaAssociacao = await this.createAtividadeRecursoUseCase.execute({
        atividadeId: body.atividadeId,
        tipoRecursoId: body.tipoRecursoId,
      });
      
      return res.status(201).json(novaAssociacao);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Tipo de recurso não encontrado') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Esta associação já existe') {
          return res.status(409).json({ error: error.message });
        }
      }
      return res.status(400).json({ error });
    }
  }
  
  // Listar todos os tipos de recursos necessários para uma atividade específica
  async getByAtividade(req: Request, res: Response) {
    try {
      const { params } = atividadeIdSchema.parse(req);
      const { atividadeId } = params;
      
      const tiposRecurso = await this.getRecursosByAtividadeUseCase.execute(atividadeId);
      
      return res.status(200).json(tiposRecurso);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada') {
          return res.status(404).json({ error: error.message });
        }
      }
      return res.status(400).json({ error });
    }
  }
  
  // Listar todas as atividades que necessitam de um tipo de recurso específico
  async getByTipoRecurso(req: Request, res: Response) {
    try {
      const { params } = tipoRecursoIdSchema.parse(req);
      const { tipoRecursoId } = params;
      
      const atividades = await this.getAtividadesByTipoRecursoUseCase.execute(tipoRecursoId);
      
      return res.status(200).json(atividades);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Tipo de recurso não encontrado') {
          return res.status(404).json({ error: error.message });
        }
      }
      return res.status(400).json({ error });
    }
  }
  
  // Remover a associação entre uma atividade e um tipo de recurso
  async delete(req: Request, res: Response) {
    try {
      const { params } = atividadeRecursoIdSchema.parse(req);
      const { atividadeId, tipoRecursoId } = params;
      
      await this.deleteAtividadeRecursoUseCase.execute({
        atividadeId,
        tipoRecursoId,
      });
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Associação não encontrada') {
          return res.status(404).json({ error: error.message });
        }
      }
      return res.status(400).json({ error });
    }
  }
}