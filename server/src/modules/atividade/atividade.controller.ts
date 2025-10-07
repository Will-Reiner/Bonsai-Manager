import { Request, Response } from 'express';
import { createAtividadeSchema, updateAtividadeSchema, atividadeIdSchema } from './atividade.schema';
import { CreateAtividadeUseCase } from './use-cases/create-atividade.use-case';
import { GetAllAtividadesUseCase } from './use-cases/get-all-atividades.use-case';
import { GetAtividadeByIdUseCase } from './use-cases/get-atividade-by-id.use-case';
import { UpdateAtividadeUseCase } from './use-cases/update-atividade.use-case';
import { DeleteAtividadeUseCase } from './use-cases/delete-atividade.use-case';
import { PrismaAtividadeRepository } from './repositories/prisma-atividade.repository';

// Initialize dependencies
const atividadeRepository = new PrismaAtividadeRepository();
const createAtividadeUseCase = new CreateAtividadeUseCase(atividadeRepository);
const getAllAtividadesUseCase = new GetAllAtividadesUseCase(atividadeRepository);
const getAtividadeByIdUseCase = new GetAtividadeByIdUseCase(atividadeRepository);
const updateAtividadeUseCase = new UpdateAtividadeUseCase(atividadeRepository);
const deleteAtividadeUseCase = new DeleteAtividadeUseCase(atividadeRepository);

export const atividadeController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = createAtividadeSchema.parse(req).body;
      const novaAtividade = await createAtividadeUseCase.execute(data);
      return res.status(201).json(novaAtividade);
    } catch (error) {
      console.error('ERRO AO CRIAR ATIVIDADE:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Já existe uma atividade com este nome.') {
          return res.status(409).json({ message: error.message });
        }
      }
      
      return res.status(400).json({ error });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const atividades = await getAllAtividadesUseCase.execute();
      return res.json(atividades);
    } catch (error) {
      return res.status(500).json({ error });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      const atividade = await getAtividadeByIdUseCase.execute(id);
      return res.json(atividade);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
      }
      
      return res.status(500).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      const data = updateAtividadeSchema.parse(req).body;

      const atividadeAtualizada = await updateAtividadeUseCase.execute({ id, ...data });
      return res.json(atividadeAtualizada);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Já existe uma atividade com este nome.') {
          return res.status(409).json({ message: error.message });
        }
      }
      
      return res.status(500).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = atividadeIdSchema.parse(req).params;
      await deleteAtividadeUseCase.execute(id);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Atividade não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
      }
      
      return res.status(500).json({ error });
    }
  },
};