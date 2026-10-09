import type { Agenda } from '@/types';

const dataFeita = (a: Agenda) => a.dataConcluida ?? a.dataAgendada;

/** Pendentes da planta, da data mais antiga para a mais nova. */
export function pendentesDaPlanta(agendas: Agenda[], plantaId: string): Agenda[] {
  return agendas
    .filter((a) => a.plantaId === plantaId && a.status === 'PENDENTE')
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
}

/** Cuidado concluído mais recente da planta. */
export function ultimoCuidado(agendas: Agenda[], plantaId: string): Agenda | undefined {
  let ultimo: Agenda | undefined;
  for (const a of agendas) {
    if (a.plantaId !== plantaId || a.status !== 'CONCLUIDO') continue;
    if (!ultimo || dataFeita(a) > dataFeita(ultimo)) ultimo = a;
  }
  return ultimo;
}

/** Data + N dias, mantendo o horário local. */
export function adiarData(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/** Dias digitados no "Adiar": inteiro de 1 a 3650, senão null. */
export function diasDeAdiamento(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 3650 ? n : null;
}

export interface ResultadoLote<T> {
  feitos: T[];
  total: number;
  /** Primeiro erro, se algum falhou. */
  erro?: unknown;
}

/** Roda a ação em todos ao mesmo tempo; uma falha não impede as outras. */
export async function emLote<T>(itens: T[], fn: (item: T) => Promise<unknown>): Promise<ResultadoLote<T>> {
  const res = await Promise.allSettled(itens.map(fn));
  const falha = res.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  return { feitos: itens.filter((_, i) => res[i].status === 'fulfilled'), total: itens.length, ...(falha && { erro: falha.reason }) };
}

/** "Tarefa excluída", "3 tarefas reagendadas", "2 de 3 reagendadas". */
export function textoResultadoLote(feitos: number, total: number, acao: 'reagendada' | 'excluída'): string {
  if (feitos < total) return `${feitos} de ${total} ${acao}s`;
  return total === 1 ? `Tarefa ${acao}` : `${total} tarefas ${acao}s`;
}
