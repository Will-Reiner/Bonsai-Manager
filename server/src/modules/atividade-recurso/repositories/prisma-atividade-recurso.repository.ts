import { prisma } from '../../../lib/prisma';
import {
  AtividadeRecursoRepository,
  CreateAtividadeRecursoDTO,
  DeleteAtividadeRecursoDTO,
  AtividadeRecursoResponseDTO,
  AtividadeRecursoWithTipoRecursoDTO,
  AtividadeRecursoWithAtividadeDTO,
} from '../atividade-recurso.types';

export class PrismaAtividadeRecursoRepository implements AtividadeRecursoRepository {
  async create(data: CreateAtividadeRecursoDTO): Promise<AtividadeRecursoResponseDTO> {
    const associacao = await prisma.atividadeRecursoSugerido.create({
      data: {
        atividadeId: data.atividadeId,
        tipoRecursoId: data.tipoRecursoId,
      },
    });

    return {
      atividadeId: associacao.atividadeId,
      tipoRecursoId: associacao.tipoRecursoId,
    };
  }

  async delete(data: DeleteAtividadeRecursoDTO): Promise<void> {
    await prisma.atividadeRecursoSugerido.delete({
      where: {
        atividadeId_tipoRecursoId: {
          atividadeId: data.atividadeId,
          tipoRecursoId: data.tipoRecursoId,
        },
      },
    });
  }

  async getByAtividade(atividadeId: string): Promise<AtividadeRecursoWithTipoRecursoDTO[]> {
    const associacoes = await prisma.atividadeRecursoSugerido.findMany({
      where: { atividadeId },
      include: { tipoRecurso: true },
    });

    return associacoes.map(associacao => ({
      atividadeId: associacao.atividadeId,
      tipoRecursoId: associacao.tipoRecursoId,
      tipoRecurso: {
        id: associacao.tipoRecurso.id,
        nome: associacao.tipoRecurso.nome,
      },
    }));
  }

  async getByTipoRecurso(tipoRecursoId: string): Promise<AtividadeRecursoWithAtividadeDTO[]> {
    const associacoes = await prisma.atividadeRecursoSugerido.findMany({
      where: { tipoRecursoId },
      include: { atividade: true },
    });

    return associacoes.map(associacao => ({
      atividadeId: associacao.atividadeId,
      tipoRecursoId: associacao.tipoRecursoId,
      atividade: {
        id: associacao.atividade.id,
        nome: associacao.atividade.nome,
        descricao: associacao.atividade.descricao,
        createdAt: associacao.atividade.createdAt,
      },
    }));
  }

  async exists(data: CreateAtividadeRecursoDTO): Promise<boolean> {
    const associacao = await prisma.atividadeRecursoSugerido.findUnique({
      where: {
        atividadeId_tipoRecursoId: {
          atividadeId: data.atividadeId,
          tipoRecursoId: data.tipoRecursoId,
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

  async tipoRecursoExists(tipoRecursoId: string): Promise<boolean> {
    const tipoRecurso = await prisma.tipoRecurso.findUnique({
      where: { id: tipoRecursoId },
    });

    return !!tipoRecurso;
  }
}