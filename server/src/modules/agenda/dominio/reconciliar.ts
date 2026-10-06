export interface PendenteReconciliavel {
  id: string;
  plantaId: string;
  atividadeId: string;
  dataAgendada: Date;
  rotinaId: string | null;
}

export interface Reconciliacao {
  /** Pendentes que viram o registro do cuidado (em vez de criar agenda nova). */
  absorver: { agendaId: string; plantaId: string; atividadeId: string }[];
  /** Pendentes repetidas do mesmo cuidado na mesma planta: já foram feitas pelo registro. */
  cancelar: string[];
}

/** Casa as pendentes escolhidas com os cuidados registrados: a mais antiga de cada (planta, atividade) absorve o registro. */
export function reconciliar(
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  pendentes: PendenteReconciliavel[],
): Reconciliacao {
  const feitos = new Set(cuidados.flatMap((c) => c.atividadeIds.map((a) => `${c.plantaId}|${a}`)));
  const usados = new Set<string>();
  const r: Reconciliacao = { absorver: [], cancelar: [] };

  for (const p of [...pendentes].sort((a, b) => a.dataAgendada.getTime() - b.dataAgendada.getTime())) {
    const par = `${p.plantaId}|${p.atividadeId}`;
    if (!feitos.has(par)) throw new Error('Tarefa não corresponde ao cuidado registrado.');
    if (usados.has(par)) {
      r.cancelar.push(p.id);
    } else {
      usados.add(par);
      r.absorver.push({ agendaId: p.id, plantaId: p.plantaId, atividadeId: p.atividadeId });
    }
  }
  return r;
}
