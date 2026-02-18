import { Request, Response } from 'express';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
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
import { GetEspeciesSugeridasUseCase } from './use-cases/get-especies-sugeridas.use-case';
import { PrismaEspecieRepository } from './repositories/prisma-especie.repository';
import { prisma } from '../../lib/prisma';

// Initialize dependencies
const especieRepository = new PrismaEspecieRepository();
const createEspecieUseCase = new CreateEspecieUseCase(especieRepository);
const getAllEspeciesUseCase = new GetAllEspeciesUseCase(especieRepository);
const getEspecieByIdUseCase = new GetEspecieByIdUseCase(especieRepository);
const updateEspecieUseCase = new UpdateEspecieUseCase(especieRepository);
const deleteEspecieUseCase = new DeleteEspecieUseCase(especieRepository);
const getEspeciesSugeridasUseCase = new GetEspeciesSugeridasUseCase(especieRepository);

const getUserRole = async (userId: string): Promise<boolean> => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
};

export const especieController = {
  create: async (req: Request, res: Response) => {
    try {
      const data = createEspecieSchema.parse(req).body;
      const userId = req.user!.userId;
      const isAdmin = await getUserRole(userId);

      const novaEspecie = await createEspecieUseCase.execute({ data, userId, isAdmin });
      return res.status(201).json(novaEspecie);
    } catch (error) {
      console.error('ERRO AO CRIAR ESPÉCIE:', error);

      if (error instanceof Error) {
        if (error.message === 'Já existe uma espécie com este nome científico.') {
          return res.status(409).json({ message: error.message });
        }
        if (error.message === 'O nome comum é obrigatório para sugestão de espécie.') {
          return res.status(400).json({ message: error.message });
        }
      }

      return res.status(400).json({ error });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const especies = await getAllEspeciesUseCase.execute();

      // Paginação opcional: se ?page for fornecido, retorna paginado
      if (req.query.page) {
        const params = parsePagination(req.query);
        const paginatedData = especies.slice(params.skip, params.skip + params.take);
        return res.status(200).json(buildPaginatedResponse(paginatedData, especies.length, params));
      }

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
      const userId = req.user!.userId;
      const isAdmin = await getUserRole(userId);

      const especieAtualizada = await updateEspecieUseCase.execute({ id, isAdmin, ...data });
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
        if (error.message === 'Apenas administradores podem alterar o status da espécie.') {
          return res.status(403).json({ message: error.message });
        }
      }

      return res.status(400).json({ error });
    }
  },

  getSugeridas: async (_req: Request, res: Response) => {
    try {
      const sugeridas = await getEspeciesSugeridasUseCase.execute();
      return res.status(200).json(sugeridas);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESPÉCIES SUGERIDAS:', error);
      return res.status(500).json({ error: 'Erro ao buscar espécies sugeridas.' });
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
