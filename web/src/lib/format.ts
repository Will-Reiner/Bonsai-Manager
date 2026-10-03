import type { Agenda, ModoAquisicao, Planta } from '@/types';
import { MODOS_AQUISICAO } from '@/types';

export const plantaTitulo = (p?: Partial<Planta> | null) =>
  p?.nome || p?.identificador || p?.especie?.nomeComum || p?.especie?.nomeCientifico || 'Planta sem nome';

export const especieNome = (e?: { nomeComum?: string | null; nomeCientifico?: string | null } | null) =>
  e?.nomeComum || e?.nomeCientifico || 'Espécie desconhecida';

export const modoAquisicaoLabel = (m?: ModoAquisicao | null) =>
  MODOS_AQUISICAO.find((x) => x.value === m)?.label ?? '—';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Diferença em dias de calendário entre a data e hoje (negativo = passado). */
export function diasAte(iso: string): number {
  const ms = startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime();
  return Math.round(ms / 86_400_000);
}

const fmtCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const fmtLonga = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });

export const dataCurta = (iso: string) => fmtCurta.format(new Date(iso)).replace('.', '');
export const dataLonga = (iso: string) => fmtLonga.format(new Date(iso));

/** "Hoje", "Amanhã", "Ontem", "há 3 dias", "quinta-feira", "12 de out." */
export function dataRelativa(iso: string): string {
  const d = diasAte(iso);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Amanhã';
  if (d === -1) return 'Ontem';
  if (d < 0 && d > -7) return `há ${-d} dias`;
  if (d > 1 && d < 7) return fmtSemana.format(new Date(iso));
  return dataCurta(iso);
}

/** Idade aproximada a partir da data de aquisição: "2 anos e 3 meses", "5 meses". */
export function tempoDesde(iso?: string | null): string | null {
  if (!iso) return null;
  const inicio = new Date(iso);
  const hoje = new Date();
  let meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + hoje.getMonth() - inicio.getMonth();
  if (hoje.getDate() < inicio.getDate()) meses -= 1;
  if (meses < 1) return 'menos de 1 mês';
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const a = anos ? `${anos} ano${anos > 1 ? 's' : ''}` : '';
  const m = resto ? `${resto} ${resto > 1 ? 'meses' : 'mês'}` : '';
  return [a, m].filter(Boolean).join(' e ');
}

/** Valor para <input type="date"> a partir de ISO (data local). */
export function toDateInput(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Converte "AAAA-MM-DD" do input para ISO, ao meio-dia local (evita virar o dia por fuso). */
export function fromDateInput(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

export function agruparTarefas(agendas: Agenda[]) {
  const pendentes = agendas.filter((a) => a.status === 'PENDENTE');
  return {
    atrasadas: pendentes.filter((a) => diasAte(a.dataAgendada) < 0),
    hoje: pendentes.filter((a) => diasAte(a.dataAgendada) === 0),
    proximas: pendentes.filter((a) => {
      const d = diasAte(a.dataAgendada);
      return d > 0 && d <= 7;
    }),
    depois: pendentes.filter((a) => diasAte(a.dataAgendada) > 7),
  };
}
