import { diasAte, fromDateInput } from './format';
import type { Agenda } from '@/types';

/** Outra tarefa a até esses dias da nova ganha o aviso leve. */
export const DIAS_PERTO = 3;

export type AvisoAgenda = 'duplicada' | 'perto' | null;

export type ItemAgenda =
  | {
      tipo: 'existente';
      agenda: Agenda;
      /** Dias até hoje (negativo = atrasada). */
      dias: number;
      /** Dias em relação à nova (negativo = antes dela); 0 sem data nova. */
      distancia: number;
      atrasada: boolean;
      aviso: AvisoAgenda;
    }
  | { tipo: 'nova'; dias: number };

/**
 * Pendentes da planta em ordem de data com a tarefa nova encaixada (depois das existentes do mesmo dia).
 * `duplicada` = mesmo cuidado já marcado (a qualquer distância); `perto` = outra tarefa a até DIAS_PERTO dias.
 * `ignorarId` tira a própria tarefa ao reagendar. Sem `data`, não há nova nem avisos.
 */
export function agendaDaPlanta(
  agendas: Agenda[],
  { plantaId, data, atividadeIds, ignorarId }: { plantaId: string; data: string; atividadeIds: string[]; ignorarId?: string },
): ItemAgenda[] {
  const diasNova = data ? diasAte(fromDateInput(data)) : null;
  const existentes: ItemAgenda[] = agendas
    .filter((a) => a.plantaId === plantaId && a.status === 'PENDENTE' && a.id !== ignorarId)
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada))
    .map((agenda) => {
      const dias = diasAte(agenda.dataAgendada);
      const distancia = diasNova === null ? 0 : dias - diasNova;
      const aviso: AvisoAgenda =
        diasNova === null
          ? null
          : atividadeIds.includes(agenda.atividadeId)
            ? 'duplicada'
            : Math.abs(distancia) <= DIAS_PERTO
              ? 'perto'
              : null;
      return { tipo: 'existente', agenda, dias, distancia, atrasada: dias < 0, aviso };
    });
  if (diasNova === null) return existentes;
  const i = existentes.findIndex((e) => e.dias > diasNova);
  const nova: ItemAgenda = { tipo: 'nova', dias: diasNova };
  return i < 0 ? [...existentes, nova] : [...existentes.slice(0, i), nova, ...existentes.slice(i)];
}

/**
 * Recorte para caber na tela: as existentes com aviso sempre aparecem, e as demais vagas (até `max`)
 * vão para as mais próximas da nova. `janela` descarta (sem contar) o que estiver a mais de N dias dela.
 * `antes`/`depois` contam as escondidas de cada lado da nova.
 */
export function recortarAgenda(itens: ItemAgenda[], { max, janela }: { max: number; janela?: number }) {
  const dentro = itens.filter((i) => i.tipo === 'nova' || janela === undefined || Math.abs(i.distancia) <= janela);
  const existentes = dentro.filter((i) => i.tipo === 'existente');
  const comAviso = existentes.filter((i) => i.aviso);
  const porProximidade = existentes
    .filter((i) => !i.aviso)
    .sort((a, b) => Math.abs(a.distancia) - Math.abs(b.distancia));
  const mostrar = new Set<ItemAgenda>([...comAviso, ...porProximidade.slice(0, Math.max(0, max - comAviso.length))]);
  const visiveis = dentro.filter((i) => i.tipo === 'nova' || mostrar.has(i));
  const escondidas = existentes.filter((i) => !mostrar.has(i));
  return {
    visiveis,
    antes: escondidas.filter((i) => i.distancia < 0).length,
    depois: escondidas.filter((i) => i.distancia >= 0).length,
  };
}
