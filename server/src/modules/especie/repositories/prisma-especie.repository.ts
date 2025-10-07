import { prisma } from '../../../lib/prisma';
import {
  EspecieRepository,
  CreateEspecieRequestDTO,
  UpdateEspecieRequestDTO,
  EspecieResponseDTO,
  EspecieWithRelationsResponseDTO,
} from '../especie.types';

export class PrismaEspecieRepository implements EspecieRepository {
  async create(data: CreateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    return await prisma.especie.create({
      data,
    });
  }

  async findAll(): Promise<EspecieResponseDTO[]> {
    return await prisma.especie.findMany({
      orderBy: { nomeComum: 'asc' },
    });
  }

  async findById(id: string): Promise<EspecieWithRelationsResponseDTO | null> {
    return await prisma.especie.findUnique({
      where: { id },
      include: {
        guiasDeTecnicas: {
          include: {
            atividade: true,
          },
        },
        guiasSazonais: {
          include: {
            atividade: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateEspecieRequestDTO): Promise<EspecieResponseDTO> {
    return await prisma.especie.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.especie.delete({
      where: { id },
    });
  }

  async existsByNomeCientifico(nomeCientifico: string): Promise<boolean> {
    const especie = await prisma.especie.findUnique({
      where: { nomeCientifico },
      select: { id: true },
    });
    return !!especie;
  }

  async existsByNomeCientificoExcludingId(nomeCientifico: string, excludeId: string): Promise<boolean> {
    const especie = await prisma.especie.findFirst({
      where: {
        nomeCientifico,
        id: { not: excludeId },
      },
      select: { id: true },
    });
    return !!especie;
  }
}