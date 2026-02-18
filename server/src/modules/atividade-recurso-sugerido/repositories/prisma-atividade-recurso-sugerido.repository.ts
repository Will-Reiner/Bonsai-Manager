import { prisma } from '../../../lib/prisma';
import {
  AtividadeRecursoSugeridoRepository,
  CreateAtividadeRecursoSugeridoDTO,
  DeleteAtividadeRecursoSugeridoDTO,
  AtividadeRecursoSugeridoResponseDTO,
} from '../atividade-recurso-sugerido.types';

export class PrismaAtividadeRecursoSugeridoRepository implements AtividadeRecursoSugeridoRepository {
  async create(data: CreateAtividadeRecursoSugeridoDTO): Promise<AtividadeRecursoSugeridoResponseDTO> {
    const result = await prisma.atividadeRecursoSugerido.create({
      data: {
        atividadeId: data.atividadeId,
        tipoRecursoId: data.tipoRecursoId,
      },
    });

    return {
      atividadeId: result.atividadeId,
      tipoRecursoId: result.tipoRecursoId,
    };
  }

  async delete(data: DeleteAtividadeRecursoSugeridoDTO): Promise<void> {
    await prisma.atividadeRecursoSugerido.delete({
      where: {
        atividadeId_tipoRecursoId: {
          atividadeId: data.atividadeId,
          tipoRecursoId: data.tipoRecursoId,
        },
      },
    });
  }

  async findByAtividade(atividadeId: string): Promise<any[]> {
    return await prisma.atividadeRecursoSugerido.findMany({
      where: { atividadeId },
      include: { tipoRecurso: true },
    });
  }

  async exists(atividadeId: string, tipoRecursoId: string): Promise<boolean> {
    const result = await prisma.atividadeRecursoSugerido.findUnique({
      where: {
        atividadeId_tipoRecursoId: {
          atividadeId,
          tipoRecursoId,
        },
      },
    });

    return result !== null;
  }

  async atividadeExists(atividadeId: string): Promise<boolean> {
    const result = await prisma.atividade.findUnique({
      where: { id: atividadeId },
    });

    return result !== null;
  }

  async tipoRecursoExists(tipoRecursoId: string): Promise<boolean> {
    const result = await prisma.tipoRecurso.findUnique({
      where: { id: tipoRecursoId },
    });

    return result !== null;
  }
}