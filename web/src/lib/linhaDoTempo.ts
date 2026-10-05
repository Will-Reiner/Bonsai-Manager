import { diasAte, toDateInput } from './format';
import type { Agenda, Foto } from '@/types';

export const dataDaFoto = (f: Foto) => f.dataCaptura ?? f.createdAt;

/** Só imagens, da mais nova para a mais antiga. */
export const fotosOrdenadas = (fotos: Foto[] = []) =>
  fotos.filter((f) => f.tipo !== 'VIDEO').sort((a, b) => dataDaFoto(b).localeCompare(dataDaFoto(a)));

export type ItemLinha =
  | { tipo: 'tarefa'; data: string; agenda: Agenda; estado: 'futura' | 'atrasada' | 'feita' }
  | { tipo: 'fotos'; data: string; fotos: Foto[] };

export const chaveItem = (i: ItemLinha) => (i.tipo === 'tarefa' ? `t-${i.agenda.id}` : `f-${i.data}`);

/**
 * Linha do tempo da planta, da mais antiga para a mais nova:
 * `passado` — cuidados concluídos e fotos avulsas agrupadas por dia;
 * `pendentes` — atrasadas e depois as futuras.
 * Fotos registradas junto com um cuidado ficam só dentro do cuidado (não aparecem de novo como "fotos do dia").
 */
export function linhaDoTempo(agendas: Agenda[], fotos: Foto[] = []) {
  const concluidas = agendas.filter((a) => a.status === 'CONCLUIDO');
  const idsConcluidas = new Set(concluidas.map((a) => a.id));
  const doCuidado = new Set(concluidas.flatMap((a) => a.fotos?.map((f) => f.id) ?? []));
  const avulsas = fotosOrdenadas(fotos).filter((f) => !doCuidado.has(f.id) && !(f.agendaId && idsConcluidas.has(f.agendaId)));

  const feitas: ItemLinha[] = concluidas.map((a) => ({ tipo: 'tarefa', data: a.dataConcluida ?? a.dataAgendada, agenda: a, estado: 'feita' }));

  const porDia = new Map<string, Foto[]>();
  for (const f of [...avulsas].reverse()) {
    const dia = toDateInput(dataDaFoto(f));
    porDia.set(dia, [...(porDia.get(dia) ?? []), f]);
  }
  const grupos: ItemLinha[] = [...porDia.values()].map((fs) => ({ tipo: 'fotos', data: dataDaFoto(fs[0]), fotos: fs }));

  const passado = [...feitas, ...grupos].sort((a, b) => a.data.localeCompare(b.data));
  const pendentes: ItemLinha[] = agendas
    .filter((a) => a.status === 'PENDENTE')
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada))
    .map((a) => ({ tipo: 'tarefa', data: a.dataAgendada, agenda: a, estado: diasAte(a.dataAgendada) < 0 ? 'atrasada' : 'futura' }));

  return { passado, pendentes };
}
