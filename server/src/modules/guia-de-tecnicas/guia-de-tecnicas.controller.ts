import { Request, Response } from 'express';
import { createGuiaDeTecnicasSchema, updateGuiaDeTecnicasSchema, GuiaDeTecnicasIdSchema } from './guia-de-tecnicas.schema';
import { PrismaGuiaDeTecnicasRepository } from './repositories/prisma-guia-de-tecnicas.repository';
import {
  CreateGuiaDeTecnicasUseCase,
  UpdateGuiaDeTecnicasUseCase,
  DeleteGuiaDeTecnicasUseCase,
  GetAllGuiasDeTecnicasUseCase,
  GetGuiasDeTecnicasByEspecieUseCase,
} from './use-cases';

export class GuiaDeTecnicasController {
  private repository: PrismaGuiaDeTecnicasRepository;
  private createGuiaDeTecnicasUseCase: CreateGuiaDeTecnicasUseCase;
  private updateGuiaDeTecnicasUseCase: UpdateGuiaDeTecnicasUseCase;
  private deleteGuiaDeTecnicasUseCase: DeleteGuiaDeTecnicasUseCase;
  private getAllGuiasDeTecnicasUseCase: GetAllGuiasDeTecnicasUseCase;
  private getGuiasDeTecnicasByEspecieUseCase: GetGuiasDeTecnicasByEspecieUseCase;

  constructor() {
    this.repository = new PrismaGuiaDeTecnicasRepository();
    this.createGuiaDeTecnicasUseCase = new CreateGuiaDeTecnicasUseCase(this.repository);
    this.updateGuiaDeTecnicasUseCase = new UpdateGuiaDeTecnicasUseCase(this.repository);
    this.deleteGuiaDeTecnicasUseCase = new DeleteGuiaDeTecnicasUseCase(this.repository);
    this.getAllGuiasDeTecnicasUseCase = new GetAllGuiasDeTecnicasUseCase(this.repository);
    this.getGuiasDeTecnicasByEspecieUseCase = new GetGuiasDeTecnicasByEspecieUseCase(this.repository);
  }

  getAll = async (_req: Request, res: Response) => {
    try {
      const guias = await this.getAllGuiasDeTecnicasUseCase.execute();
      return res.status(200).json(guias);
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar guias de técnicas.' });
    }
  };

  getByEspecie = async (req: Request, res: Response) => {
    try {
      const { especieId } = req.params;
      const guias = await this.getGuiasDeTecnicasByEspecieUseCase.execute(especieId);
      return res.status(200).json(guias);
    } catch (error) {
      if (error instanceof Error && error.message === 'Espécie não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar guias de técnicas.' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const validatedData = createGuiaDeTecnicasSchema.parse(req);

      const result = await this.createGuiaDeTecnicasUseCase.execute(validatedData.body);

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
      const validatedData = updateGuiaDeTecnicasSchema.parse(req);
      const { especieId, atividadeId } = validatedData.params;

      const result = await this.updateGuiaDeTecnicasUseCase.execute(
        especieId,
        atividadeId,
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
      const validatedData = GuiaDeTecnicasIdSchema.parse(req);
      const { especieId, atividadeId } = validatedData.params;

      await this.deleteGuiaDeTecnicasUseCase.execute(especieId, atividadeId);

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