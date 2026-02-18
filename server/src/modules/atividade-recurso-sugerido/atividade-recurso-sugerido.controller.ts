import { Request, Response } from 'express';
import { atividadeRecursoSugeridoSchema } from './atividade-recurso-sugerido.schema';
import { PrismaAtividadeRecursoSugeridoRepository } from './repositories/prisma-atividade-recurso-sugerido.repository';
import {
  CreateAtividadeRecursoSugeridoUseCase,
  DeleteAtividadeRecursoSugeridoUseCase,
  GetRecursosSugeridosByAtividadeUseCase,
} from './use-cases';

export class AtividadeRecursoSugeridoController {
  private atividadeRecursoSugeridoRepository: PrismaAtividadeRecursoSugeridoRepository;
  private createAtividadeRecursoSugeridoUseCase: CreateAtividadeRecursoSugeridoUseCase;
  private deleteAtividadeRecursoSugeridoUseCase: DeleteAtividadeRecursoSugeridoUseCase;
  private getRecursosSugeridosByAtividadeUseCase: GetRecursosSugeridosByAtividadeUseCase;

  constructor() {
    this.atividadeRecursoSugeridoRepository = new PrismaAtividadeRecursoSugeridoRepository();
    this.createAtividadeRecursoSugeridoUseCase = new CreateAtividadeRecursoSugeridoUseCase(
      this.atividadeRecursoSugeridoRepository
    );
    this.deleteAtividadeRecursoSugeridoUseCase = new DeleteAtividadeRecursoSugeridoUseCase(
      this.atividadeRecursoSugeridoRepository
    );
    this.getRecursosSugeridosByAtividadeUseCase = new GetRecursosSugeridosByAtividadeUseCase(
      this.atividadeRecursoSugeridoRepository
    );
  }

  async getByAtividade(req: Request, res: Response) {
    try {
      const { atividadeId } = req.params;
      const recursos = await this.getRecursosSugeridosByAtividadeUseCase.execute(atividadeId);
      return res.status(200).json(recursos);
    } catch (error) {
      if (error instanceof Error && error.message === 'Atividade não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar recursos sugeridos.' });
    }
  }

  // Cria a associação
  async create(req: Request, res: Response) {
    try {
      const { params } = atividadeRecursoSugeridoSchema.parse(req);
      const { atividadeId, tipoRecursoId } = params;
      
      const novaAssociacao = await this.createAtividadeRecursoSugeridoUseCase.execute({
        atividadeId,
        tipoRecursoId,
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

  // Apaga a associação
  async delete(req: Request, res: Response) {
    try {
      const { params } = atividadeRecursoSugeridoSchema.parse(req);
      const { atividadeId, tipoRecursoId } = params;
      
      await this.deleteAtividadeRecursoSugeridoUseCase.execute({
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