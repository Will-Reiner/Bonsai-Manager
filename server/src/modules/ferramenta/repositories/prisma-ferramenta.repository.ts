import { prisma } from '../../../lib/prisma';
import { FerramentaRepository, CreateFerramentaDTO, UpdateFerramentaDTO } from '../types/ferramenta.types';
import { Ferramenta } from '@prisma/client';

export class PrismaFerramentaRepository implements FerramentaRepository {
  async create(data: CreateFerramentaDTO): Promise<Ferramenta> {
    return await prisma.ferramenta.create({
      data,
    });
  }

  async findMany(): Promise<Ferramenta[]> {
    return await prisma.ferramenta.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findById(id: string): Promise<Ferramenta | null> {
    return await prisma.ferramenta.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateFerramentaDTO): Promise<Ferramenta> {
    return await prisma.ferramenta.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.ferramenta.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const ferramenta = await prisma.ferramenta.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!ferramenta;
  }

  async existsByName(nome: string): Promise<boolean> {
    const ferramenta = await prisma.ferramenta.findFirst({
      where: { nome },
      select: { id: true },
    });
    return !!ferramenta;
  }

  async existsByNameExcludingId(nome: string, id: string): Promise<boolean> {
    const ferramenta = await prisma.ferramenta.findFirst({
      where: { 
        nome,
        id: { not: id },
      },
      select: { id: true },
    });
    return !!ferramenta;
  }
}