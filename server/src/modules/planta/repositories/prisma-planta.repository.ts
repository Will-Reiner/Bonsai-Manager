import { PrismaClient, type GrupoPlanta } from '@prisma/client';
import { ATIVIDADE_TRANSPLANTE, PREF_PRE_TRANSPLANTE_DIAS } from '../../agenda/agenda.types';
import { diasDePreTransplante, PlantaPre } from '../dominio/grupo';
import { PlantaRepository, CreatePlantaDTO, UpdatePlantaDTO, PlantaWithEspecie } from '../types/planta.types';

const SELECT_PLANTA = {
  id: true,
  especieId: true,
  usuarioId: true,
  nome: true,
  identificador: true,
  dataAquisicao: true,
  modoAquisicao: true,
  observacoes: true,
  fotoCapaUrl: true,
  plantaPublica: true,
  historicoPublico: true,
  grupo: true,
  grupoAnterior: true,
  grupoExpiraEm: true,
  preTransplanteAgendaId: true,
  createdAt: true,
  updatedAt: true,
  especie: { select: { nomeCientifico: true, nomeComum: true } },
} as const;

export class PrismaPlantaRepository implements PlantaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePlantaDTO): Promise<PlantaWithEspecie> {
    return await this.prisma.planta.create({
      data: {
        especieId: data.especieId,
        usuarioId: data.usuarioId,
        nome: data.nome,
        identificador: data.identificador,
        dataAquisicao: data.dataAquisicao,
        modoAquisicao: data.modoAquisicao,

        observacoes: data.observacoes,
        fotoCapaUrl: data.fotoCapaUrl,
        plantaPublica: data.plantaPublica ?? false,
        historicoPublico: data.historicoPublico ?? false,
        grupo: data.grupo,
      },
      select: SELECT_PLANTA,
    });
  }

  async findManyByUser(usuarioId: string): Promise<PlantaWithEspecie[]> {
    return await this.prisma.planta.findMany({
      where: {
        usuarioId,
      },
      select: SELECT_PLANTA,
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
      select: SELECT_PLANTA,
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
        identificador: data.identificador,
        dataAquisicao: data.dataAquisicao,
        modoAquisicao: data.modoAquisicao,

        observacoes: data.observacoes,
        fotoCapaUrl: data.fotoCapaUrl,
        plantaPublica: data.plantaPublica,
        historicoPublico: data.historicoPublico,
        grupo: data.grupo,
        grupoAnterior: data.grupoAnterior,
        grupoExpiraEm: data.grupoExpiraEm,
      },
      select: SELECT_PLANTA,
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

  async findUrlsDeMidia(id: string): Promise<string[]> {
    const planta = await this.prisma.planta.findUnique({
      where: { id },
      select: { fotoCapaUrl: true, fotos: { select: { caminhoArquivo: true, thumbnailUrl: true } } },
    });
    if (!planta) return [];
    return [planta.fotoCapaUrl, ...planta.fotos.flatMap((f) => [f.caminhoArquivo, f.thumbnailUrl])].filter(
      (u): u is string => !!u,
    );
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

  async resolverGruposVencidos(usuarioId: string, agora: Date): Promise<void> {
    // Copia coluna→coluna (o Prisma não faz isso em updateMany)
    await this.prisma.$executeRaw`
      UPDATE "Planta"
      SET "grupo" = "grupoAnterior", "grupoAnterior" = NULL, "grupoExpiraEm" = NULL, "updatedAt" = NOW()
      WHERE "usuarioId" = ${usuarioId} AND "grupoExpiraEm" <= ${agora}`;
  }

  async estadoPreTransplante(usuarioId: string) {
    const [pref, pendentes] = await Promise.all([
      this.prisma.preferenciaUsuario.findUnique({
        where: { usuarioId_chave: { usuarioId, chave: PREF_PRE_TRANSPLANTE_DIAS } },
      }),
      this.prisma.agenda.findMany({
        where: { status: 'PENDENTE', atividade: { nome: ATIVIDADE_TRANSPLANTE }, planta: { usuarioId } },
        select: { id: true, plantaId: true, dataAgendada: true },
      }),
    ]);
    const plantas = await this.prisma.planta.findMany({
      where: { usuarioId, OR: [{ grupo: 'PRE_TRANSPLANTE' }, { id: { in: [...new Set(pendentes.map((p) => p.plantaId))] } }] },
      select: { id: true, grupo: true, grupoAnterior: true, preTransplanteAgendaId: true },
    });
    return {
      dias: diasDePreTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...g }) => ({ plantaId: id, ...g })),
      pendentes: pendentes.map((p) => ({ plantaId: p.plantaId, agendaId: p.id, dataAgendada: p.dataAgendada })),
    };
  }

  async aplicarMudancasPre(mudancas: (PlantaPre & { grupoLido: GrupoPlanta | null })[]): Promise<void> {
    await this.prisma.$transaction(
      mudancas.map((m) =>
        this.prisma.planta.updateMany({
          where: {
            id: m.plantaId,
            // Só grava se o grupo não mudou desde a leitura (registro/troca manual concorrente vence)
            grupo: m.grupoLido,
          },
          data: { grupo: m.grupo, grupoAnterior: m.grupoAnterior, preTransplanteAgendaId: m.preTransplanteAgendaId },
        }),
      ),
    );
  }
}
