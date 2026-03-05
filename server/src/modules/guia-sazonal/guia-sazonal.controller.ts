import { Request, Response } from 'express';
import { createGuiaSazonalSchema, updateGuiaSazonalSchema, GuiaSazonalIdSchema } from './guia-sazonal.schema';
import { PrismaGuiaSazonalRepository } from './repositories/prisma-guia-sazonal.repository';
import {
  CreateGuiaSazonalUseCase,
  UpdateGuiaSazonalUseCase,
  DeleteGuiaSazonalUseCase,
  GetAllGuiasSazonaisUseCase,
  GetGuiasSazonaisByEspecieUseCase,
} from './use-cases';

export class GuiaSazonalController {
  private repository: PrismaGuiaSazonalRepository;
  private createGuiaSazonalUseCase: CreateGuiaSazonalUseCase;
  private updateGuiaSazonalUseCase: UpdateGuiaSazonalUseCase;
  private deleteGuiaSazonalUseCase: DeleteGuiaSazonalUseCase;
  private getAllGuiasSazonaisUseCase: GetAllGuiasSazonaisUseCase;
  private getGuiasSazonaisByEspecieUseCase: GetGuiasSazonaisByEspecieUseCase;

  constructor() {
    this.repository = new PrismaGuiaSazonalRepository();
    this.createGuiaSazonalUseCase = new CreateGuiaSazonalUseCase(this.repository);
    this.updateGuiaSazonalUseCase = new UpdateGuiaSazonalUseCase(this.repository);
    this.deleteGuiaSazonalUseCase = new DeleteGuiaSazonalUseCase(this.repository);
    this.getAllGuiasSazonaisUseCase = new GetAllGuiasSazonaisUseCase(this.repository);
    this.getGuiasSazonaisByEspecieUseCase = new GetGuiasSazonaisByEspecieUseCase(this.repository);
  }

  getAll = async (_req: Request, res: Response) => {
    try {
      const guias = await this.getAllGuiasSazonaisUseCase.execute();
      return res.status(200).json(guias);
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar guias sazonais.' });
    }
  };

  getByEspecie = async (req: Request, res: Response) => {
    try {
      const { especieId } = req.params;
      const guias = await this.getGuiasSazonaisByEspecieUseCase.execute(especieId);
      return res.status(200).json(guias);
    } catch (error) {
      if (error instanceof Error && error.message === 'Espécie não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar guias sazonais.' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const validatedData = createGuiaSazonalSchema.parse(req);

      const result = await this.createGuiaSazonalUseCase.execute(validatedData.body);

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Espécie não encontrada') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Atividade não encontrada') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Esta associação já existe') {
          return res.status(409).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const validatedData = updateGuiaSazonalSchema.parse(req);
      const { especieId, atividadeId, estacao } = validatedData.params;

      const result = await this.updateGuiaSazonalUseCase.execute(
        especieId,
        atividadeId,
        estacao,
        validatedData.body
      );

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Associação não encontrada') {
          return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const validatedData = GuiaSazonalIdSchema.parse(req);
      const { especieId, atividadeId, estacao } = validatedData.params;

      await this.deleteGuiaSazonalUseCase.execute(especieId, atividadeId, estacao);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Associação não encontrada') {
          return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  };
}