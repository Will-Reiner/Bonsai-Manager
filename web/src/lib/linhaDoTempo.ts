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
 * Linha do tempo da planta: primeiro as pendentes (da mais futura até a mais atrasada),
 * depois o que já aconteceu — cuidados concluídos e fotos agrupadas por dia — do mais recente ao mais antigo.
 */
export function linhaDoTempo(agendas: Agenda[], fotos: Foto[] = []) {
  const pendentes: ItemLinha[] = agendas
    .filter((a) => a.status === 'PENDENTE')
    .sort((a, b) => b.dataAgendada.localeCompare(a.dataAgendada))
    .map((a) => ({ tipo: 'tarefa', data: a.dataAgendada, agenda: a, estado: diasAte(a.dataAgendada) < 0 ? 'atrasada' : 'futura' }));

  const feitas: ItemLinha[] = agendas
    .filter((a) => a.status === 'CONCLUIDO')
    .map((a) => ({ tipo: 'tarefa', data: a.dataConcluida ?? a.dataAgendada, agenda: a, estado: 'feita' }));

  const porDia = new Map<string, Foto[]>();
  for (const f of fotosOrdenadas(fotos)) {
    const dia = toDateInput(dataDaFoto(f));
    porDia.set(dia, [...(porDia.get(dia) ?? []), f]);
  }
  const grupos: ItemLinha[] = [...porDia.values()].map((fs) => ({ tipo: 'fotos', data: dataDaFoto(fs[0]), fotos: fs }));

  const passado = [...feitas, ...grupos].sort((a, b) => b.data.localeCompare(a.data));
  return { pendentes, passado };
}
