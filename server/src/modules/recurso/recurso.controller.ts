import { Request, Response } from 'express';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { createRecursoSchema, updateRecursoSchema, recursoIdSchema } from './recurso.schema';
import { PrismaRecursoRepository } from './repositories/prisma-recurso.repository';
import {
  CreateRecursoUseCase,
  GetAllRecursosByUserUseCase,
  GetRecursoByIdUseCase,
  UpdateRecursoUseCase,
  DeleteRecursoUseCase,
} from './use-cases';

export class RecursoController {
  private createRecursoUseCase: CreateRecursoUseCase;
  private getAllRecursosByUserUseCase: GetAllRecursosByUserUseCase;
  private getRecursoByIdUseCase: GetRecursoByIdUseCase;
  private updateRecursoUseCase: UpdateRecursoUseCase;
  private deleteRecursoUseCase: DeleteRecursoUseCase;

  constructor() {
    const recursoRepository = new PrismaRecursoRepository();
    
    this.createRecursoUseCase = new CreateRecursoUseCase(recursoRepository);
    this.getAllRecursosByUserUseCase = new GetAllRecursosByUserUseCase(recursoRepository);
    this.getRecursoByIdUseCase = new GetRecursoByIdUseCase(recursoRepository);
    this.updateRecursoUseCase = new UpdateRecursoUseCase(recursoRepository);
    this.deleteRecursoUseCase = new DeleteRecursoUseCase(recursoRepository);
  }

  // Criar um novo recurso para o utilizador logado
  async create(req: Request, res: Response) {
    try {
      const usuarioId = req.user!.userId;
      const data = createRecursoSchema.parse(req).body;

      const novoRecurso = await this.createRecursoUseCase.execute(data, usuarioId);

      return res.status(201).json(novoRecurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  }

  // Listar todos os recursos DO UTILIZADOR LOGADO
  async getAllByUser(req: Request, res: Response) {
    try {
      const usuarioId = req.user!.userId;
      const recursos = await this.getAllRecursosByUserUseCase.execute(usuarioId);

      if (req.query.page) {
        const params = parsePagination(req.query);
        const paginatedData = recursos.slice(params.skip, params.skip + params.take);
        return res.status(200).json(buildPaginatedResponse(paginatedData, recursos.length, params));
      }

      return res.status(200).json(recursos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar recursos.' });
    }
  }

  // Obter um recurso específico, verificando se pertence ao utilizador
  async getById(req: Request, res: Response) {
    try {
      const usuarioId = req.user!.userId;
      const { id } = recursoIdSchema.parse(req).params;

      const recurso = await this.getRecursoByIdUseCase.execute(id, usuarioId);

      return res.status(200).json(recurso);
    } catch (error) {
      if (error instanceof Error && error.message === 'Recurso não encontrado ou não pertence a si.') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  }

  // Atualizar um recurso, verificando se pertence ao utilizador
  async update(req: Request, res: Response) {
    try {
      const usuarioId = req.user!.userId;
      const { id } = updateRecursoSchema.parse(req).params;
      const dataToUpdate = updateRecursoSchema.parse(req).body;

      const recursoAtualizado = await this.updateRecursoUseCase.execute(id, dataToUpdate, usuarioId);

      return res.status(200).json(recursoAtualizado);
    } catch (error) {
      if (error instanceof Error && error.message === 'Recurso não encontrado ou não pertence a si.') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  }

  // Apagar um recurso, verificando se pertence ao utilizador
  async delete(req: Request, res: Response) {
    try {
      const usuarioId = req.user!.userId;
      const { id } = recursoIdSchema.parse(req).params;

      await this.deleteRecursoUseCase.execute(id, usuarioId);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Recurso não encontrado ou não pertence a si.') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  }
}