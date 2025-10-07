import { Request, Response } from 'express';
import {
  createEspecieSchema,
  updateEspecieSchema,
  especieIdSchema,
} from './especie.schema';
import { CreateEspecieUseCase } from './use-cases/create-especie.use-case';
import { GetAllEspeciesUseCase } from './use-cases/get-all-especies.use-case';
import { GetEspecieByIdUseCase } from './use-cases/get-especie-by-id.use-case';
import { UpdateEspecieUseCase } from './use-cases/update-especie.use-case';
import { DeleteEspecieUseCase } from './use-cases/delete-especie.use-case';
import { PrismaEspecieRepository } from './repositories/prisma-especie.repository';

// Initialize dependencies
const especieRepository = new PrismaEspecieRepository();
const createEspecieUseCase = new CreateEspecieUseCase(especieRepository);
const getAllEspeciesUseCase = new GetAllEspeciesUseCase(especieRepository);
const getEspecieByIdUseCase = new GetEspecieByIdUseCase(especieRepository);
const updateEspecieUseCase = new UpdateEspecieUseCase(especieRepository);
const deleteEspecieUseCase = new DeleteEspecieUseCase(especieRepository);

export const especieController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = createEspecieSchema.parse(req).body;
      const novaEspecie = await createEspecieUseCase.execute(data);
      return res.status(201).json(novaEspecie);
    } catch (error) {
      console.error('ERRO AO CRIAR ESPÉCIE:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Já existe uma espécie com este nome científico.') {
          return res.status(409).json({ message: error.message });
        }
      }
      
      return res.status(400).json({ error });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const especies = await getAllEspeciesUseCase.execute();
      return res.status(200).json(especies);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESPÉCIES:', error);
      return res.status(500).json({ error: 'Erro ao buscar espécies.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      const especie = await getEspecieByIdUseCase.execute(id);
      return res.status(200).json(especie);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESPÉCIE:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Espécie não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
      }
      
      return res.status(500).json({ error: 'Erro ao buscar espécie.' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      const data = updateEspecieSchema.parse(req).body;

      const especieAtualizada = await updateEspecieUseCase.execute({ id, ...data });
      return res.status(200).json(especieAtualizada);
    } catch (error) {
      console.error('ERRO AO ATUALIZAR ESPÉCIE:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Espécie não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Já existe uma espécie com este nome científico.') {
          return res.status(409).json({ message: error.message });
        }
      }
      
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      await deleteEspecieUseCase.execute(id);
      return res.status(204).send();
    } catch (error) {
      console.error('ERRO AO DELETAR ESPÉCIE:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Espécie não encontrada.') {
          return res.status(404).json({ message: error.message });
        }
      }
      
      return res.status(400).json({ error });
    }
  },
};