import { prisma } from '../../../lib/prisma';
import {
  AtividadeFerramentaSugeridaRepository,
  CreateAtividadeFerramentaSugeridaDTO,
  DeleteAtividadeFerramentaSugeridaDTO,
  AtividadeFerramentaSugeridaResponseDTO,
} from '../atividade-ferramenta-sugerida.types';

export class PrismaAtividadeFerramentaSugeridaRepository implements AtividadeFerramentaSugeridaRepository {
  async create(data: CreateAtividadeFerramentaSugeridaDTO): Promise<AtividadeFerramentaSugeridaResponseDTO> {
    const associacao = await prisma.atividadeFerramentaSugerida.create({
      data: {
        atividadeId: data.atividadeId,
        ferramentaId: data.ferramentaId,
      },
    });

    return {
      atividadeId: associacao.atividadeId,
      ferramentaId: associacao.ferramentaId,
    };
  }

  async delete(data: DeleteAtividadeFerramentaSugeridaDTO): Promise<void> {
    await prisma.atividadeFerramentaSugerida.delete({
      where: {
        atividadeId_ferramentaId: {
          atividadeId: data.atividadeId,
          ferramentaId: data.ferramentaId,
        },
      },
    });
  }

  async exists(data: CreateAtividadeFerramentaSugeridaDTO): Promise<boolean> {
    const associacao = await prisma.atividadeFerramentaSugerida.findUnique({
      where: {
        atividadeId_ferramentaId: {
          atividadeId: data.atividadeId,
          ferramentaId: data.ferramentaId,
        },
      },
    });

    return !!associacao;
  }

  async atividadeExists(atividadeId: string): Promise<boolean> {
    const atividade = await prisma.atividade.findUnique({
      where: { id: atividadeId },
    });

    return !!atividade;
  }

  async ferramentaExists(ferramentaId: string): Promise<boolean> {
    const ferramenta = await prisma.ferramenta.findUnique({
      where: { id: ferramentaId },
    });

    return !!ferramenta;
  }
}