import { prisma } from '../../../lib/prisma';
import { CreateFotoDTO, UpdateFotoDTO, FotoRepository } from '../foto.types';

export class PrismaFotoRepository implements FotoRepository {
  async create(data: CreateFotoDTO) {
    return await prisma.foto.create({
      data,
    });
  }

  async findManyByPlanta(plantaId: string) {
    return await prisma.foto.findMany({
      where: { plantaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndUser(id: string, usuarioId: string) {
    return await prisma.foto.findFirst({
      where: { id, usuarioId },
    });
  }

  async update(id: string, data: UpdateFotoDTO) {
    return await prisma.foto.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.foto.delete({
      where: { id },
    });
  }

  async existsByIdAndUser(id: string, usuarioId: string): Promise<boolean> {
    const foto = await prisma.foto.findFirst({
      where: { id, usuarioId },
      select: { id: true },
    });
    return !!foto;
  }

  async checkPlantaBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean> {
    const planta = await prisma.planta.findFirst({
      where: { id: plantaId, usuarioId },
      select: { id: true },
    });
    return !!planta;
  }
}