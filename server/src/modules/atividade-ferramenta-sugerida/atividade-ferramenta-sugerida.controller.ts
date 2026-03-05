import { Request, Response } from 'express';
import { atividadeFerramentaSugeridaSchema } from './atividade-ferramenta-sugerida.schema';
import { PrismaAtividadeFerramentaSugeridaRepository } from './repositories/prisma-atividade-ferramenta-sugerida.repository';
import {
  CreateAtividadeFerramentaSugeridaUseCase,
  DeleteAtividadeFerramentaSugeridaUseCase,
  GetFerramentasSugeridasByAtividadeUseCase,
} from './use-cases';

export class AtividadeFerramentaSugeridaController {
  private atividadeFerramentaSugeridaRepository: PrismaAtividadeFerramentaSugeridaRepository;
  private createAtividadeFerramentaSugeridaUseCase: CreateAtividadeFerramentaSugeridaUseCase;
  private deleteAtividadeFerramentaSugeridaUseCase: DeleteAtividadeFerramentaSugeridaUseCase;
  private getFerramentasSugeridasByAtividadeUseCase: GetFerramentasSugeridasByAtividadeUseCase;

  constructor() {
    this.atividadeFerramentaSugeridaRepository = new PrismaAtividadeFerramentaSugeridaRepository();
    this.createAtividadeFerramentaSugeridaUseCase = new CreateAtividadeFerramentaSugeridaUseCase(
      this.atividadeFerramentaSugeridaRepository
    );
    this.deleteAtividadeFerramentaSugeridaUseCase = new DeleteAtividadeFerramentaSugeridaUseCase(
      this.atividadeFerramentaSugeridaRepository
    );
    this.getFerramentasSugeridasByAtividadeUseCase = new GetFerramentasSugeridasByAtividadeUseCase(
      this.atividadeFerramentaSugeridaRepository
    );
  }

  async getByAtividade(req: Request, res: Response) {
    try {
      const { atividadeId } = req.params;
      const ferramentas = await this.getFerramentasSugeridasByAtividadeUseCase.execute(atividadeId);
      return res.status(200).json(ferramentas);
    } catch (error) {
      if (error instanceof Error && error.message === 'Atividade não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar ferramentas sugeridas.' });
    }
  }

  // Cria a associação
  async create(req: Request, res: Response) {
    try {
      const { params } = atividadeFerramentaSugeridaSchema.parse(req);
      const { atividadeId, ferramentaId } = params;

      const novaAssociacao = await this.createAtividadeFerramentaSugeridaUseCase.execute({
        atividadeId,
        ferramentaId,
      });

      return res.status(201).json(novaAssociacao);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Ferramenta não encontrada') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Associação já existe') {
          return res.status(409).json({ error: error.message });
        }
      }
      return res.status(400).json({ error });
    }
  }

  // Apaga a associação
  async delete(req: Request, res: Response) {
    try {
      const { params } = atividadeFerramentaSugeridaSchema.parse(req);
      const { atividadeId, ferramentaId } = params;

      await this.deleteAtividadeFerramentaSugeridaUseCase.execute({
        atividadeId,
        ferramentaId,
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