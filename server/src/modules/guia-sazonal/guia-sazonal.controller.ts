import { Request, Response } from 'express';
import { createGuiaSazonalSchema, updateGuiaSazonalSchema, GuiaSazonalIdSchema } from './guia-sazonal.schema';
import { PrismaGuiaSazonalRepository } from './repositories/prisma-guia-sazonal.repository';
import { CreateGuiaSazonalUseCase, UpdateGuiaSazonalUseCase, DeleteGuiaSazonalUseCase } from './use-cases';

export class GuiaSazonalController {
  private repository: PrismaGuiaSazonalRepository;
  private createGuiaSazonalUseCase: CreateGuiaSazonalUseCase;
  private updateGuiaSazonalUseCase: UpdateGuiaSazonalUseCase;
  private deleteGuiaSazonalUseCase: DeleteGuiaSazonalUseCase;

  constructor() {
    this.repository = new PrismaGuiaSazonalRepository();
    this.createGuiaSazonalUseCase = new CreateGuiaSazonalUseCase(this.repository);
    this.updateGuiaSazonalUseCase = new UpdateGuiaSazonalUseCase(this.repository);
    this.deleteGuiaSazonalUseCase = new DeleteGuiaSazonalUseCase(this.repository);
  }

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