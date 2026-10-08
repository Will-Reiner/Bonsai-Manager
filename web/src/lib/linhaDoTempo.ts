import { diasAte, toDateInput } from './format';
import type { Agenda, Foto } from '@/types';

export const dataDaFoto = (f: Foto) => f.dataCaptura ?? f.createdAt;

/** Só imagens, da mais nova para a mais antiga. */
export const fotosOrdenadas = (fotos: Foto[] = []) =>
  fotos.filter((f) => f.tipo !== 'VIDEO').sort((a, b) => dataDaFoto(b).localeCompare(dataDaFoto(a)));

export type FotoMini = { id: string; caminhoArquivo: string };

/** Descrição ou obs. de um cuidado do dia; `atividades` null = vale para todas as tarefas do card. */
export interface NotaCuidado {
  tipo: 'detalhes' | 'obs';
  texto: string;
  atividades: string[] | null;
}

export type ItemLinha =
  | { tipo: 'tarefa'; data: string; agenda: Agenda; estado: 'futura' | 'atrasada' }
  | { tipo: 'cuidado'; data: string; agendas: Agenda[]; fotos: FotoMini[]; notas: NotaCuidado[] }
  | { tipo: 'fotos'; data: string; fotos: Foto[] };

export const chaveItem = (i: ItemLinha) =>
  i.tipo === 'tarefa' ? `t-${i.agenda.id}` : i.tipo === 'cuidado' ? `c-${toDateInput(i.data)}` : `f-${i.data}`;

const dataFeita = (a: Agenda) => a.dataConcluida ?? a.dataAgendada;
const nomeDe = (a: Agenda) => a.atividade?.nome ?? 'Cuidado';

/** "Adubação + Desaramação" (sem repetir nomes). */
export const tituloCuidado = (agendas: Agenda[]) => [...new Set(agendas.map(nomeDe))].join(' + ');

/** Descrições e obs. do card, sem repetir texto; com o nome das tarefas só quando o texto não vale para todas. */
export function notasDoCuidado(agendas: Agenda[]): NotaCuidado[] {
  const notas: NotaCuidado[] = [];
  for (const tipo of ['detalhes', 'obs'] as const) {
    const donasDe = new Map<string, Agenda[]>();
    for (const a of agendas) {
      const texto = (tipo === 'detalhes' ? a.detalhes : a.observacaoFutura)?.trim();
      if (texto) donasDe.set(texto, [...(donasDe.get(texto) ?? []), a]);
    }
    for (const [texto, donas] of donasDe) {
      notas.push({ tipo, texto, atividades: donas.length === agendas.length ? null : [...new Set(donas.map(nomeDe))] });
    }
  }
  return notas;
}

/** Concluídas agrupadas por dia local, cada dia em ordem de conclusão. */
function porDiaDeConclusao(concluidas: Agenda[]) {
  const porDia = new Map<string, Agenda[]>();
  for (const a of [...concluidas].sort((x, y) => dataFeita(x).localeCompare(dataFeita(y)))) {
    const dia = toDateInput(dataFeita(a));
    porDia.set(dia, [...(porDia.get(dia) ?? []), a]);
  }
  return porDia;
}

/** Tarefas concluídas da mesma planta no mesmo dia da tarefa (ela inclusa), na ordem do card. */
export function tarefasDoDia(agendas: Agenda[], agenda: Agenda): Agenda[] {
  if (agenda.status !== 'CONCLUIDO') return [agenda];
  const concluidas = agendas.filter((a) => a.status === 'CONCLUIDO' && a.plantaId === agenda.plantaId);
  return porDiaDeConclusao(concluidas).get(toDateInput(dataFeita(agenda))) ?? [agenda];
}

/**
 * Linha do tempo da planta, da mais antiga para a mais nova:
 * `passado` — um cuidado por dia (tarefas concluídas + fotos do dia) e fotos avulsas de dias sem cuidado;
 * `pendentes` — atrasadas e depois as futuras, uma por tarefa.
 */
export function linhaDoTempo(agendas: Agenda[], fotos: Foto[] = []) {
  const concluidas = agendas.filter((a) => a.status === 'CONCLUIDO');
  const idsConcluidas = new Set(concluidas.map((a) => a.id));
  const doCuidado = new Set(concluidas.flatMap((a) => a.fotos?.map((f) => f.id) ?? []));
  const avulsas = fotosOrdenadas(fotos).filter((f) => !doCuidado.has(f.id) && !(f.agendaId && idsConcluidas.has(f.agendaId)));

  const avulsasPorDia = new Map<string, Foto[]>();
  for (const f of [...avulsas].reverse()) {
    const dia = toDateInput(dataDaFoto(f));
    avulsasPorDia.set(dia, [...(avulsasPorDia.get(dia) ?? []), f]);
  }

  const cuidados: ItemLinha[] = [...porDiaDeConclusao(concluidas)].map(([dia, doDia]) => {
    const fotosDoDia = avulsasPorDia.get(dia) ?? [];
    avulsasPorDia.delete(dia);
    return {
      tipo: 'cuidado',
      data: dataFeita(doDia[0]),
      agendas: doDia,
      fotos: [...doDia.flatMap((a) => a.fotos ?? []), ...fotosDoDia],
      notas: notasDoCuidado(doDia),
    };
  });
  const grupos: ItemLinha[] = [...avulsasPorDia.values()].map((fs) => ({ tipo: 'fotos', data: dataDaFoto(fs[0]), fotos: fs }));

  const passado = [...cuidados, ...grupos].sort((a, b) => a.data.localeCompare(b.data));
  const pendentes: ItemLinha[] = agendas
    .filter((a) => a.status === 'PENDENTE')
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada))
    .map((a) => ({ tipo: 'tarefa', data: a.dataAgendada, agenda: a, estado: diasAte(a.dataAgendada) < 0 ? 'atrasada' : 'futura' }));

  return { passado, pendentes };
}
