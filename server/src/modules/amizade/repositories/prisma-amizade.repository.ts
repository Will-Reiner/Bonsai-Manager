import { prisma } from '../../../lib/prisma';
import { AmizadeRepository, FollowDTO, UnfollowDTO, AmizadeResponseDTO } from '../amizade.types';

export class PrismaAmizadeRepository implements AmizadeRepository {

  async follow(data: FollowDTO): Promise<AmizadeResponseDTO> {
    return await prisma.amizade.create({
      data: {
        seguidorId: data.seguidorId,
        seguidoId: data.seguidoId,
      },
    });
  }

  async unfollow(data: UnfollowDTO): Promise<void> {
    await prisma.amizade.delete({
      where: {
        seguidorId_seguidoId: {
          seguidorId: data.seguidorId,
          seguidoId: data.seguidoId,
        },
      },
    });
  }

  async existsAmizade(seguidorId: string, seguidoId: string): Promise<boolean> {
    const amizade = await prisma.amizade.findUnique({
      where: {
        seguidorId_seguidoId: {
          seguidorId,
          seguidoId,
        },
      },
      select: { seguidorId: true },
    });
    return !!amizade;
  }

  async findSeguidores(userId: string): Promise<any[]> {
    return await prisma.amizade.findMany({
      where: { seguidoId: userId },
      include: {
        seguidor: {
          select: { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true },
        },
      },
    });
  }

  async findSeguindo(userId: string): Promise<any[]> {
    return await prisma.amizade.findMany({
      where: { seguidorId: userId },
      include: {
        seguido: {
          select: { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true },
        },
      },
    });
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }
}