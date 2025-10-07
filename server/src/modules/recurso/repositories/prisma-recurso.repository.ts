import { prisma } from '../../../lib/prisma';
import { CreateRecursoDTO, UpdateRecursoDTO, RecursoRepository } from '../recurso.types';

export class PrismaRecursoRepository implements RecursoRepository {
  async create(data: CreateRecursoDTO, usuarioId: string) {
    return await prisma.recurso.create({
      data: {
        ...data,
        usuarioId,
      },
    });
  }

  async findManyByUser(usuarioId: string) {
    return await prisma.recurso.findMany({
      where: { usuarioId },
      include: { tipoRecurso: true },
    });
  }

  async findByIdAndUser(id: string, usuarioId: string) {
    return await prisma.recurso.findFirst({
      where: { id, usuarioId },
      include: { tipoRecurso: true },
    });
  }

  async update(id: string, data: UpdateRecursoDTO) {
    return await prisma.recurso.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.recurso.delete({
      where: { id },
    });
  }

  async existsByIdAndUser(id: string, usuarioId: string): Promise<boolean> {
    const recurso = await prisma.recurso.findFirst({
      where: { id, usuarioId },
      select: { id: true },
    });
    return !!recurso;
  }
}