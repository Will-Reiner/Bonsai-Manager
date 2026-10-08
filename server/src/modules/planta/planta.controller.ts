import { Request, Response } from 'express';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { prisma } from '../../lib/prisma';
import { createPlantaSchema, updatePlantaSchema, plantaIdSchema } from './planta.schema';
import { 
  CreatePlantaUseCase, 
  GetPlantasByUserUseCase, 
  GetPlantaByIdUseCase, 
  UpdatePlantaUseCase, 
  DeletePlantaUseCase 
} from './use-cases';
import { PrismaPlantaRepository, PrismaEspecieRepository } from './repositories';
import { criarLimpezaDeMidia } from '../midia/limpeza-de-midia';

// Inicialização dos repositórios
const plantaRepository = new PrismaPlantaRepository(prisma);
const especieRepository = new PrismaEspecieRepository(prisma);
const limpezaDeMidia = criarLimpezaDeMidia();

// Inicialização dos use cases
const createPlantaUseCase = new CreatePlantaUseCase(plantaRepository, especieRepository);
const getPlantasByUserUseCase = new GetPlantasByUserUseCase(plantaRepository);
const getPlantaByIdUseCase = new GetPlantaByIdUseCase(plantaRepository);
const updatePlantaUseCase = new UpdatePlantaUseCase(plantaRepository, especieRepository, limpezaDeMidia);
const deletePlantaUseCase = new DeletePlantaUseCase(plantaRepository, limpezaDeMidia);

export const plantaController = {
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createPlantaSchema.parse(req).body;

      const novaPlanta = await createPlantaUseCase.execute({
        ...data,
        usuarioId,
      });

      return res.status(201).json(novaPlanta);
    } catch (error: any) {
      if (error.message === 'Espécie não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      // Violação de unicidade (usuarioId + identificador)
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'Já existe uma planta com esse código.' });
      }
      return res.status(400).json({ error: error.message || 'Erro ao criar planta' });
    }
  },

  getAllByUser: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const plantas = await getPlantasByUserUseCase.execute(usuarioId);

      if (req.query.page) {
        const params = parsePagination(req.query);
        const paginatedData = plantas.slice(params.skip, params.skip + params.take);
        return res.status(200).json(buildPaginatedResponse(paginatedData, plantas.length, params));
      }

      return res.status(200).json(plantas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao buscar plantas.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;

      const planta = await getPlantaByIdUseCase.execute(id, usuarioId);
      return res.status(200).json(planta);
    } catch (error: any) {
      if (error.message === 'Planta não encontrada ou não pertence ao usuário') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error: error.message || 'Erro ao buscar planta' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;
      const data = updatePlantaSchema.parse(req).body;

      const plantaAtualizada = await updatePlantaUseCase.execute(id, usuarioId, data);
      return res.status(200).json(plantaAtualizada);
    } catch (error: any) {
      if (error.message === 'Planta não encontrada ou não pertence ao usuário') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Espécie não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error: error.message || 'Erro ao atualizar planta' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = plantaIdSchema.parse(req).params;

      await deletePlantaUseCase.execute(id, usuarioId);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Planta não encontrada ou não pertence ao usuário') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ error: error.message || 'Erro ao deletar planta' });
    }
  },
};