import { PrismaClient } from '@prisma/client';
import { PlantaRepository, CreatePlantaDTO, UpdatePlantaDTO, PlantaWithEspecie } from '../types/planta.types';

export class PrismaPlantaRepository implements PlantaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePlantaDTO): Promise<PlantaWithEspecie> {
    return await this.prisma.planta.create({
      data: {
        especieId: data.especieId,
        usuarioId: data.usuarioId,
        nome: data.nome,
        dataAquisicao: data.dataAquisicao,
        modoAquisicao: data.modoAquisicao,
        visao: data.visao,
        observacoes: data.observacoes,
        plantaPublica: data.plantaPublica ?? false,
        historicoPublico: data.historicoPublico ?? false,
      },
      select: {
        id: true,
        especieId: true,
        usuarioId: true,
        nome: true,
        dataAquisicao: true,
        modoAquisicao: true,
        visao: true,
        observacoes: true,
        plantaPublica: true,
        historicoPublico: true,
        createdAt: true,
        updatedAt: true,
        especie: {
          select: {
            nomeCientifico: true,
            nomeComum: true,
          },
        },
      },
    });
  }

  async findManyByUser(usuarioId: string): Promise<PlantaWithEspecie[]> {
    return await this.prisma.planta.findMany({
      where: {
        usuarioId,
      },
      select: {
        id: true,
        especieId: true,
        usuarioId: true,
        nome: true,
        dataAquisicao: true,
        modoAquisicao: true,
        visao: true,
        observacoes: true,
        plantaPublica: true,
        historicoPublico: true,
        createdAt: true,
        updatedAt: true,
        especie: {
          select: {
            nomeCientifico: true,
            nomeComum: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdAndUser(id: string, usuarioId: string): Promise<PlantaWithEspecie | null> {
    return await this.prisma.planta.findFirst({
      where: {
        id,
        usuarioId,
      },
      select: {
        id: true,
        especieId: true,
        usuarioId: true,
        nome: true,
        dataAquisicao: true,
        modoAquisicao: true,
        visao: true,
        observacoes: true,
        plantaPublica: true,
        historicoPublico: true,
        createdAt: true,
        updatedAt: true,
        especie: {
          select: {
            nomeCientifico: true,
            nomeComum: true,
          },
        },
      },
    });
  }

  async update(id: string, usuarioId: string, data: UpdatePlantaDTO): Promise<PlantaWithEspecie> {
    return await this.prisma.planta.update({
      where: {
        id,
        usuarioId,
      },
      data: {
        especieId: data.especieId,
        nome: data.nome,
        dataAquisicao: data.dataAquisicao,
        modoAquisicao: data.modoAquisicao,
        visao: data.visao,
        observacoes: data.observacoes,
        plantaPublica: data.plantaPublica,
        historicoPublico: data.historicoPublico,
      },
      select: {
        id: true,
        especieId: true,
        usuarioId: true,
        nome: true,
        dataAquisicao: true,
        modoAquisicao: true,
        visao: true,
        observacoes: true,
        plantaPublica: true,
        historicoPublico: true,
        createdAt: true,
        updatedAt: true,
        especie: {
          select: {
            nomeCientifico: true,
            nomeComum: true,
          },
        },
      },
    });
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    await this.prisma.planta.delete({
      where: {
        id,
        usuarioId,
      },
    });
  }

  async existsByIdAndUser(id: string, usuarioId: string): Promise<boolean> {
    const count = await this.prisma.planta.count({
      where: {
        id,
        usuarioId,
      },
    });
    return count > 0;
  }
}