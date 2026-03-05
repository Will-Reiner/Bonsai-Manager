import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { userIdSchema } from './user.schema';
import { GetAllPublicProfilesUseCase, GetProfileByIdUseCase } from './use-cases';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

// Inicialização dos repositórios e use cases
const userRepository = new PrismaUserRepository();
const getAllPublicProfilesUseCase = new GetAllPublicProfilesUseCase(userRepository);
const getProfileByIdUseCase = new GetProfileByIdUseCase(userRepository);

export const userController = {
  // --- NOVA FUNÇÃO ---
  getAllPublicProfiles: async (_req: Request, res: Response) => {
    try {
      const users = await getAllPublicProfilesUseCase.execute({});
      return res.status(200).json(users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar utilizadores.';
      return res.status(500).json({ error: errorMessage });
    }
  },
  // Busca um perfil de utilizador pelo seu ID
  getProfileById: async (req: Request, res: Response) => {
    try {
      const { id } = userIdSchema.parse(req).params;
      const user = await getProfileByIdUseCase.execute({ id });
      return res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error && error.message === 'Perfil não encontrado ou é privado.') {
        return res.status(404).json({ message: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
      return res.status(400).json({ error: errorMessage });
    }
  },
};