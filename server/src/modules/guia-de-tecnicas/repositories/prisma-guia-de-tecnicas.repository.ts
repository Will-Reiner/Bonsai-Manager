import { prisma } from '../../../lib/prisma';
import {
  GuiaDeTecnicasRepository,
  CreateGuiaDeTecnicasDTO,
  UpdateGuiaDeTecnicasDTO,
  DeleteGuiaDeTecnicasDTO,
  GuiaDeTecnicasResponseDTO,
} from '../guia-de-tecnicas.types';

export class PrismaGuiaDeTecnicasRepository implements GuiaDeTecnicasRepository {
  async findAll(): Promise<GuiaDeTecnicasResponseDTO[]> {
    const results = await prisma.guiaDeTecnicas.findMany({
      include: { atividade: true, especie: true },
    });
    return results.map(r => ({
      especieId: r.especieId,
      atividadeId: r.atividadeId,
      recomendacao: r.recomendacao as any,
      observacoes: r.observacoes || undefined,
    }));
  }

  async findByEspecie(especieId: string): Promise<GuiaDeTecnicasResponseDTO[]> {
    const results = await prisma.guiaDeTecnicas.findMany({
      where: { especieId },
      include: { atividade: true },
    });
    return results.map(r => ({
      especieId: r.especieId,
      atividadeId: r.atividadeId,
      recomendacao: r.recomendacao as any,
      observacoes: r.observacoes || undefined,
    }));
  }

  async create(data: CreateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO> {
    const result = await prisma.guiaDeTecnicas.create({
      data: {
        especieId: data.especieId,
        atividadeId: data.atividadeId,
        recomendacao: data.recomendacao,
        observacoes: data.observacoes,
      },
    });

    return {
      especieId: result.especieId,
      atividadeId: result.atividadeId,
      recomendacao: result.recomendacao as any,
      observacoes: result.observacoes || undefined,
    };
  }

  async update(especieId: string, atividadeId: string, data: UpdateGuiaDeTecnicasDTO): Promise<GuiaDeTecnicasResponseDTO> {
    const result = await prisma.guiaDeTecnicas.update({
      where: {
        especieId_atividadeId: {
          especieId,
          atividadeId,
        },
      },
      data: {
        recomendacao: data.recomendacao,
        observacoes: data.observacoes,
      },
    });

    return {
      especieId: result.especieId,
      atividadeId: result.atividadeId,
      recomendacao: result.recomendacao as any,
      observacoes: result.observacoes || undefined,
    };
  }

  async delete(data: DeleteGuiaDeTecnicasDTO): Promise<void> {
    await prisma.guiaDeTecnicas.delete({
      where: {
        especieId_atividadeId: {
          especieId: data.especieId,
          atividadeId: data.atividadeId,
        },
      },
    });
  }

  async exists(especieId: string, atividadeId: string): Promise<boolean> {
    const result = await prisma.guiaDeTecnicas.findUnique({
      where: {
        especieId_atividadeId: {
          especieId,
          atividadeId,
        },
      },
    });

    return result !== null;
  }

  async especieExists(especieId: string): Promise<boolean> {
    const result = await prisma.especie.findUnique({
      where: { id: especieId },
    });

    return result !== null;
  }

  async atividadeExists(atividadeId: string): Promise<boolean> {
    const result = await prisma.atividade.findUnique({
      where: { id: atividadeId },
    });

    return result !== null;
  }
}