import { prisma } from '../../../lib/prisma';
import {
  AtividadeRepository,
  CreateAtividadeRequestDTO,
  UpdateAtividadeRequestDTO,
  AtividadeResponseDTO,
  AtividadeWithRelationsResponseDTO,
} from '../atividade.types';

export class PrismaAtividadeRepository implements AtividadeRepository {
  async create(data: CreateAtividadeRequestDTO): Promise<AtividadeResponseDTO> {
    const atividade = await prisma.atividade.create({
      data,
    });

    return atividade;
  }

  async findAll(): Promise<AtividadeResponseDTO[]> {
    const atividades = await prisma.atividade.findMany({
      orderBy: { nome: 'asc' },
    });

    return atividades;
  }

  async findById(id: string): Promise<AtividadeWithRelationsResponseDTO | null> {
    const atividade = await prisma.atividade.findUnique({
      where: { id },
      include: {
        agendas: {
          select: {
            id: true,
            dataAgendada: true,
            dataConcluida: true,
            status: true,
            detalhes: true,
            observacaoFutura: true,
            plantaId: true,
          },
        },
        guiasDeTecnicas: {
          select: {
            especieId: true,
            recomendacao: true,
            observacoes: true,
          },
        },
        guiasSazonais: {
          select: {
            especieId: true,
            estacao: true,
            momentoIdeal: true,
            observacoes: true,
          },
        },
        recursosSugeridos: {
          select: {
            tipoRecursoId: true,
          },
        },
        ferramentasSugeridas: {
          select: {
            ferramentaId: true,
          },
        },
      },
    });

    return atividade;
  }

  async update(data: UpdateAtividadeRequestDTO): Promise<AtividadeResponseDTO> {
    const { id, ...updateData } = data;
    
    const atividade = await prisma.atividade.update({
      where: { id },
      data: updateData,
    });

    return atividade;
  }

  async delete(id: string): Promise<void> {
    await prisma.atividade.delete({
      where: { id },
    });
  }

  async existsByNome(nome: string): Promise<boolean> {
    const atividade = await prisma.atividade.findUnique({
      where: { nome },
    });

    return atividade !== null;
  }

  async existsByNomeExcludingId(nome: string, id: string): Promise<boolean> {
    const atividade = await prisma.atividade.findFirst({
      where: {
        nome,
        id: { not: id },
      },
    });

    return atividade !== null;
  }
}