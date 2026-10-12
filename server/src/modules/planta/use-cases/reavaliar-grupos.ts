import type { Prisma } from '@prisma/client';
import { EstadoRecem, reavaliarRecemTransplantada } from '../dominio/grupo';

/** Cliente do Prisma ou da transação em curso. */
export type Db = Prisma.TransactionClient;

export interface PlantaReavaliavel extends EstadoRecem {
  plantaId: string;
  /** O Transplante de `transplanteAgendaId`, se ainda existe e está concluído. */
  transplante: { data: Date } | null;
}

export interface ReavaliacaoRepository {
  /** Plantas (do usuário, dentre as informadas) em Recém transplantada com Transplante de origem, e os dias da preferência. */
  estado(plantaIds: string[], usuarioId: string, db?: Db): Promise<{ dias: number; plantas: PlantaReavaliavel[] }>;
  salvar(mudancas: ({ plantaId: string } & EstadoRecem)[], db?: Db): Promise<void>;
}

/** O que uma escrita tocou: as plantas e as tarefas (criadas, alteradas ou apagadas). */
export interface Tocadas {
  plantaIds: string[];
  agendaIds: string[];
}

/** Quem grava tarefas chama no fim, com o que tocou. */
export interface ReavaliadorDeGrupos {
  execute(tocadas: Tocadas, usuarioId: string, db?: Db): Promise<void>;
}

/**
 * Corrige/desfaz Recém transplantada quando o Transplante que a colocou lá mudou ou sumiu. Só olha plantas cujo
 * Transplante de origem está entre as tarefas tocadas: escrever em outra tarefa não recalcula o prazo (que usaria
 * a preferência de dias atual, não a do registro).
 */
export class ReavaliarGruposUseCase implements ReavaliadorDeGrupos {
  constructor(
    private repo: ReavaliacaoRepository,
    private agora: () => Date = () => new Date(),
  ) {}

  async execute({ plantaIds, agendaIds }: Tocadas, usuarioId: string, db?: Db): Promise<void> {
    const ids = [...new Set(plantaIds)];
    if (!ids.length || !agendaIds.length) return;
    const tocadas = new Set(agendaIds);
    const { dias, plantas } = await this.repo.estado(ids, usuarioId, db);
    const agora = this.agora();
    const mudancas = plantas.flatMap(({ plantaId, transplante, ...estado }) => {
      if (!estado.transplanteAgendaId || !tocadas.has(estado.transplanteAgendaId)) return [];
      const novo = reavaliarRecemTransplantada(estado, transplante, dias, agora);
      return novo ? [{ plantaId, ...novo }] : [];
    });
    if (mudancas.length) await this.repo.salvar(mudancas, db);
  }
}
