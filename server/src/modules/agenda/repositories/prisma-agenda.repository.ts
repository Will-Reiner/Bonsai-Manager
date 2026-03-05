import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateAgendaDTO, UpdateAgendaDTO, AgendaRepository } from '../agenda.types';

export class PrismaAgendaRepository implements AgendaRepository {
  async create(data: CreateAgendaDTO) {
    return await prisma.agenda.create({
      data,
    });
  }

  async findManyByUser(usuarioId: string) {
    return await prisma.agenda.findMany({
      where: {
        planta: { usuarioId },
      },
      include: {
        planta: { select: { id: true, nome: true, fotoCapaUrl: true, especie: true } },
        atividade: { select: { id: true, nome: true } },
        recursosUtilizados: { include: { recurso: { include: { tipoRecurso: true } } } },
      },
      orderBy: { dataAgendada: 'asc' },
    });
  }

  async findByIdAndUser(id: string, usuarioId: string) {
    return await prisma.agenda.findFirst({
      where: { id, planta: { usuarioId } },
      include: {
        planta: { select: { id: true, nome: true, fotoCapaUrl: true, especie: true } },
        atividade: { select: { id: true, nome: true } },
        recursosUtilizados: { include: { recurso: { include: { tipoRecurso: true } } } },
      },
    });
  }

  async update(id: string, data: Omit<UpdateAgendaDTO, 'recursosUtilizados'>) {
    return await prisma.agenda.update({
      where: { id },
      data,
    });
  }

  async updateWithResources(id: string, data: UpdateAgendaDTO) {
    const { recursosUtilizados, ...updateData } = data;

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.agenda.update({
        where: { id },
        data: updateData,
      });

      if (recursosUtilizados && recursosUtilizados.length > 0) {
        // Apaga registros antigos para evitar duplicatas
        await tx.agendaRecursoUtilizado.deleteMany({ where: { agendaId: id } });

        // Cria os novos registros de recursos utilizados
        await tx.agendaRecursoUtilizado.createMany({
          data: recursosUtilizados.map(r => ({
            agendaId: id,
            recursoId: r.recursoId,
            quantidadeUtilizada: r.quantidadeUtilizada,
          })),
        });
      }
      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.agenda.delete({
      where: { id },
    });
  }

  async existsByIdAndUser(id: string, usuarioId: string): Promise<boolean> {
    const agenda = await prisma.agenda.findFirst({
      where: { id, planta: { usuarioId } },
      select: { id: true },
    });
    return !!agenda;
  }

  async checkPlantaBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean> {
    const planta = await prisma.planta.findFirst({
      where: { id: plantaId, usuarioId },
      select: { id: true },
    });
    return !!planta;
  }
}