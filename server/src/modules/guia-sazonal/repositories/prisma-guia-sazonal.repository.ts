import { prisma } from '../../../lib/prisma';
import {
  GuiaSazonalRepository,
  CreateGuiaSazonalDTO,
  UpdateGuiaSazonalDTO,
  DeleteGuiaSazonalDTO,
  GuiaSazonalResponseDTO,
  Estacao,
} from '../guia-sazonal.types';

export class PrismaGuiaSazonalRepository implements GuiaSazonalRepository {
  async create(data: CreateGuiaSazonalDTO): Promise<GuiaSazonalResponseDTO> {
    return await prisma.guiaSazonal.create({
      data,
    });
  }

  async update(
    especieId: string,
    atividadeId: string,
    estacao: Estacao,
    data: UpdateGuiaSazonalDTO
  ): Promise<GuiaSazonalResponseDTO> {
    return await prisma.guiaSazonal.update({
      where: {
        especieId_atividadeId_estacao: {
          especieId,
          atividadeId,
          estacao,
        },
      },
      data,
    });
  }

  async delete(data: DeleteGuiaSazonalDTO): Promise<void> {
    await prisma.guiaSazonal.delete({
      where: {
        especieId_atividadeId_estacao: {
          especieId: data.especieId,
          atividadeId: data.atividadeId,
          estacao: data.estacao,
        },
      },
    });
  }

  async exists(especieId: string, atividadeId: string, estacao: Estacao): Promise<boolean> {
    const guia = await prisma.guiaSazonal.findUnique({
      where: {
        especieId_atividadeId_estacao: {
          especieId,
          atividadeId,
          estacao,
        },
      },
    });
    return !!guia;
  }

  async especieExists(especieId: string): Promise<boolean> {
    const especie = await prisma.especie.findUnique({
      where: { id: especieId },
    });
    return !!especie;
  }

  async atividadeExists(atividadeId: string): Promise<boolean> {
    const atividade = await prisma.atividade.findUnique({
      where: { id: atividadeId },
    });
    return !!atividade;
  }
}