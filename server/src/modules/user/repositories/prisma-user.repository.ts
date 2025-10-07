import { prisma } from '../../../lib/prisma';
import { UserRepository, PublicUserProfileDTO, DetailedUserProfileDTO } from '../types/user.types';

export class PrismaUserRepository implements UserRepository {

  async findAllPublicProfiles(): Promise<PublicUserProfileDTO[]> {
    const users = await prisma.usuario.findMany({
      where: {
        perfilPublico: true,
        nomePublico: {
          not: null,
        },
      },
      select: {
        id: true,
        nomePublico: true,
        localidade: true,
        fotoPerfilUrl: true,
        bio: true,
      },
      orderBy: {
        nomePublico: 'asc',
      },
    });

    // TypeScript knows nomePublico is not null due to the where clause
    return users as PublicUserProfileDTO[];
  }

  async findPublicProfileById(id: string): Promise<DetailedUserProfileDTO | null> {
    const user = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nomePublico: true,
        localidade: true,
        fotoPerfilUrl: true,
        bio: true,
        perfilPublico: true,
        createdAt: true,
        plantas: {
          where: {
            plantaPublica: true,
          },
          select: {
            id: true,
            nome: true,
            dataAquisicao: true,
            plantaPublica: true,
            especie: {
              select: {
                id: true,
                nomeComum: true,
                nomeCientifico: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.perfilPublico || !user.nomePublico) {
      return null;
    }

    // Remove o campo perfilPublico do retorno
    const { perfilPublico, ...userProfile } = user;
    return userProfile as DetailedUserProfileDTO;
  }
}