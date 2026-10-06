import { Estacao, estacaoDe, proximoInicioDeEstacao } from './estacoes';

export const DIA_MS = 86_400_000;

export interface RegraRotina {
  intervaloDias: number;
  dataFim: Date | null;
  /** Vazio ou null = ano todo. */
  estacoes?: Estacao[] | null;
}

export interface RotinaBase extends RegraRotina {
  id: string;
  plantaId: string;
  atividadeId: string;
  pausada: boolean;
}

export interface RotinaEstado extends RotinaBase {
  /** Já existe uma pendente (fora as que estão sendo concluídas agora). */
  temPendente: boolean;
  /** Revisão geral da planta: remarcada por qualquer cuidado (ver `remarcarRevisoes`). */
  revisao?: boolean;
}

export interface ProximaDeRotina {
  rotinaId: string;
  plantaId: string;
  atividadeId: string;
  dataAgendada: Date;
}

/** Rolante: a próxima é `base + intervalo`; fora das estações ativas, vai para o início da próxima; depois da data final não há próxima. */
export function proximaDataRotina(regra: RegraRotina, base: Date): Date | null {
  let data = new Date(base.getTime() + regra.intervaloDias * DIA_MS);
  if (regra.estacoes?.length && !regra.estacoes.includes(estacaoDe(data))) {
    data = proximoInicioDeEstacao(regra.estacoes, data);
  }
  return regra.dataFim && data > regra.dataFim ? null : data;
}

/** Próximas pendentes das rotinas que acabaram de ser feitas (mantém 1 pendente por rotina). */
export function planejarProximas(
  rotinas: RotinaEstado[],
  feitas: { rotinaId: string; data: Date }[],
): ProximaDeRotina[] {
  const ultima = new Map<string, Date>();
  for (const f of feitas) {
    const atual = ultima.get(f.rotinaId);
    if (!atual || f.data > atual) ultima.set(f.rotinaId, f.data);
  }

  return rotinas.flatMap((r) => {
    const base = ultima.get(r.id);
    if (!base || r.pausada || r.temPendente || r.revisao) return [];
    const dataAgendada = proximaDataRotina(r, base);
    return dataAgendada ? [{ rotinaId: r.id, plantaId: r.plantaId, atividadeId: r.atividadeId, dataAgendada }] : [];
  });
}

/** A rotina é a Revisão geral da planta (remarcada por qualquer cuidado). */
export function ehRevisao(atividadeId: string, idRevisao: string | null): boolean {
  return idRevisao !== null && atividadeId === idRevisao;
}

export interface RevisaoEstado extends RotinaBase {
  /** Pendente atual (fora as concluídas agora). */
  pendenteId: string | null;
  pendenteData: Date | null;
}

export interface Remarcacao {
  mover: { agendaId: string; dataAgendada: Date }[];
  criar: ProximaDeRotina[];
}

/**
 * Qualquer cuidado na planta remarca a Revisão geral para `data + intervalo` (respeitando estações, pausa e fim).
 * Só empurra para frente: um registro retroativo não puxa a pendente para trás.
 */
export function remarcarRevisoes(revisoes: RevisaoEstado[], data: Date): Remarcacao {
  const r: Remarcacao = { mover: [], criar: [] };
  for (const rev of revisoes) {
    if (rev.pausada) continue;
    const dataAgendada = proximaDataRotina(rev, data);
    if (!dataAgendada) continue;
    if (rev.pendenteId) {
      if (!rev.pendenteData || dataAgendada > rev.pendenteData) r.mover.push({ agendaId: rev.pendenteId, dataAgendada });
    } else r.criar.push({ rotinaId: rev.id, plantaId: rev.plantaId, atividadeId: rev.atividadeId, dataAgendada });
  }
  return r;
}
