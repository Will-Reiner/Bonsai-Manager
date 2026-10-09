import type { Agenda, Estacao, GuiaSazonal } from '@/types';
import { diasAte } from './format';

/** Reconciliação: pendentes atrasadas (qualquer idade) ou que vencem em até 90 dias. */
export const JANELA_RECONCILIACAO_DIAS = 90;

/** Por planta → atividade, a data (ISO) da última vez que o cuidado foi feito. */
export function ultimasPorPlanta(agendas: Agenda[]): Map<string, Map<string, string>> {
  const mapa = new Map<string, Map<string, string>>();
  for (const a of agendas) {
    if (a.status !== 'CONCLUIDO') continue;
    const data = a.dataConcluida ?? a.dataAgendada;
    const daPlanta = mapa.get(a.plantaId) ?? new Map<string, string>();
    const atual = daPlanta.get(a.atividadeId);
    if (!atual || data > atual) daPlanta.set(a.atividadeId, data);
    mapa.set(a.plantaId, daPlanta);
  }
  return mapa;
}

const tempo = (dias: number) => (dias < 60 ? `${dias} dias` : `${Math.round(dias / 30)} meses`);
const haQuanto = (dias: number) => (dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${tempo(dias)}`);

/** Última vez numa ou em várias plantas: "hoje", "há 12 dias", "há 5 dias – há 2 meses", "nunca", "… · algumas nunca". */
export function rotuloUltima(datas: (string | undefined)[]): string {
  const dias = datas.filter((d): d is string => !!d).map((d) => Math.max(0, -diasAte(d)));
  if (!dias.length) return 'nunca';
  const min = Math.min(...dias);
  const max = Math.max(...dias);
  const base = min === max ? haQuanto(min) : `${haQuanto(min)} – ${haQuanto(max)}`;
  return dias.length < datas.length ? `${base} · algumas nunca` : base;
}

/** "atrasada há 4 dias", "agendada para hoje", "agendada daqui 12 dias". */
export function textoPrazo(iso: string): string {
  const d = diasAte(iso);
  if (d < 0) return `atrasada há ${-d} dia${d === -1 ? '' : 's'}`;
  if (d === 0) return 'agendada para hoje';
  return `agendada daqui ${d} dia${d === 1 ? '' : 's'}`;
}

/** Pendentes que um registro pode concluir: mesma planta e atividade, dentro da janela; mais antigas primeiro. */
export function candidatasReconciliacao(
  agendas: Agenda[],
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  janelaDias = JANELA_RECONCILIACAO_DIAS,
): Agenda[] {
  const pares = new Set(cuidados.flatMap((c) => c.atividadeIds.map((a) => `${c.plantaId}|${a}`)));
  return agendas
    .filter(
      (a) =>
        a.status === 'PENDENTE' &&
        pares.has(`${a.plantaId}|${a.atividadeId}`) &&
        diasAte(a.dataAgendada) <= janelaDias,
    )
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
}

/** Mediana (em dias) dos intervalos entre execuções do cuidado na planta; null com menos de 2 execuções. */
export function medianaIntervaloDias(agendas: Agenda[], plantaId: string, atividadeId: string): number | null {
  const datas = agendas
    .filter((a) => a.status === 'CONCLUIDO' && a.plantaId === plantaId && a.atividadeId === atividadeId)
    .map((a) => new Date(a.dataConcluida ?? a.dataAgendada).getTime())
    .sort((x, y) => x - y);
  const intervalos = datas
    .slice(1)
    .map((d, i) => Math.round((d - datas[i]) / 86_400_000))
    .filter((d) => d > 0)
    .sort((x, y) => x - y);
  if (!intervalos.length) return null;
  const meio = Math.floor(intervalos.length / 2);
  return intervalos.length % 2 ? intervalos[meio] : Math.round((intervalos[meio - 1] + intervalos[meio]) / 2);
}

/** "todo dia", "a cada 14 dias". */
export const textoIntervalo = (dias: number) => (dias === 1 ? 'todo dia' : `a cada ${dias} dias`);

export const ESTACOES_LISTA: { valor: Estacao; nome: string; curto: string }[] = [
  { valor: 'PRIMAVERA', nome: 'Primavera', curto: 'Prim' },
  { valor: 'VERAO', nome: 'Verão', curto: 'Ver' },
  { valor: 'OUTONO', nome: 'Outono', curto: 'Out' },
  { valor: 'INVERNO', nome: 'Inverno', curto: 'Inv' },
];

/** "" para ano todo; senão "Prim/Ver". */
export function textoEstacoes(estacoes?: Estacao[] | null): string {
  if (!estacoes?.length || estacoes.length === 4) return '';
  return ESTACOES_LISTA.filter((e) => estacoes.includes(e.valor)).map((e) => e.curto).join('/');
}

/** Estações sugeridas pelo guia sazonal para a atividade: todas menos as "evitar"; sem guia → null. */
export function estacoesDoGuia(guias: GuiaSazonal[] | undefined, atividadeId: string): Estacao[] | null {
  const daAtividade = (guias ?? []).filter((g) => g.atividadeId === atividadeId);
  if (!daAtividade.length) return null;
  const evitar = new Set(daAtividade.filter((g) => g.momentoIdeal === 'EVITAR').map((g) => g.estacao));
  return ESTACOES_LISTA.map((e) => e.valor).filter((e) => !evitar.has(e));
}
