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
    if (!base || r.pausada || r.temPendente) return [];
    const dataAgendada = proximaDataRotina(r, base);
    return dataAgendada ? [{ rotinaId: r.id, plantaId: r.plantaId, atividadeId: r.atividadeId, dataAgendada }] : [];
  });
}
