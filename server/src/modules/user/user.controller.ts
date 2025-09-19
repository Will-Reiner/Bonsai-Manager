import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { userIdSchema } from './user.schema';

export const userController = {
  // --- NOVA FUNÇÃO ---
  getAllPublicProfiles: async (_req: Request, res: Response) => {
    try {
      const users = await prisma.usuario.findMany({
        where: {
          perfilPublico: true, // Apenas perfis públicos
        },
        select: { // Retornamos apenas dados não sensíveis
          id: true,
          nomePublico: true,
          localidade: true,
          fotoPerfilUrl: true,
          bio: true,
        },
        orderBy: {
          nomePublico: 'asc',
        }
      });
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar utilizadores.' });
    }
  },
  // Busca um perfil de utilizador pelo seu ID
  getProfileById: async (req: Request, res: Response) => {
    try {
      const { id } = userIdSchema.parse(req).params;

      const user = await prisma.usuario.findUnique({
        where: { id },
        select: { // Selecionamos apenas os campos que podem ser públicos
          id: true,
          nomePublico: true,
          localidade: true,
          fotoPerfilUrl: true,
          bio: true,
          perfilPublico: true,
          createdAt: true,
          // Incluímos as plantas, mas com um filtro!
          plantas: {
            where: {
              plantaPublica: true, // Apenas plantas marcadas como públicas
            },
            include: {
              especie: true, // Inclui os detalhes da espécie
            },
          },
        },
      });

      if (!user || !user.perfilPublico) {
        return res.status(404).json({ message: 'Perfil não encontrado ou é privado.' });
      }

      // Removemos o campo de controle de privacidade antes de enviar a resposta
      const { perfilPublico, ...publicProfile } = user;

      return res.status(200).json(publicProfile);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};