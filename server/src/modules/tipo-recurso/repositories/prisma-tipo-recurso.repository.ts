import { TipoRecurso } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { TipoRecursoRepository, CreateTipoRecursoDTO, UpdateTipoRecursoDTO } from '../types/tipo-recurso.types';

export class PrismaTipoRecursoRepository implements TipoRecursoRepository {
  async create(data: CreateTipoRecursoDTO): Promise<TipoRecurso> {
    return await prisma.tipoRecurso.create({
      data,
    });
  }

  async findMany(): Promise<TipoRecurso[]> {
    return await prisma.tipoRecurso.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string): Promise<TipoRecurso | null> {
    return await prisma.tipoRecurso.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateTipoRecursoDTO): Promise<TipoRecurso> {
    return await prisma.tipoRecurso.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tipoRecurso.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await prisma.tipoRecurso.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByName(nome: string): Promise<boolean> {
    const count = await prisma.tipoRecurso.count({
      where: { nome },
    });
    return count > 0;
  }

  async existsByNameExcludingId(nome: string, id: string): Promise<boolean> {
    const count = await prisma.tipoRecurso.count({
      where: {
        nome,
        id: { not: id },
      },
    });
    return count > 0;
  }
}