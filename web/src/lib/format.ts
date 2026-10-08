import type { CSSProperties } from 'react';
import type { Agenda, GrupoPlanta, ModoAquisicao } from '@/types';
import { GRUPOS_PLANTA, MODOS_AQUISICAO } from '@/types';

/** O mínimo para nomear uma planta (Planta, Agenda['planta'], Rotina['planta'], alvo da triagem). */
export type PlantaRef =
  | {
      nome?: string | null;
      identificador?: number | null;
      especie?: { nomeComum?: string | null; nomeCientifico?: string | null } | null;
    }
  | null
  | undefined;

/** Apelido ou espécie — sem o ID; null se não houver nenhum. */
export const plantaNome = (p: PlantaRef) => p?.nome || p?.especie?.nomeComum || p?.especie?.nomeCientifico || null;

export const plantaTitulo = (p: PlantaRef) =>
  plantaNome(p) || (p?.identificador != null ? `Planta #${p.identificador}` : 'Planta sem nome');

/**
 * O que o subtítulo do card da Coleção mostra sem repetir o título:
 * `especie` (nome da espécie ou o aviso "completar") e `codigo` (#N).
 */
export function subtituloDaColecao(p: NonNullable<PlantaRef> & { especieId?: string | null }) {
  return {
    especie: !!p.nome || !p.especieId,
    codigo: plantaNome(p) && p.identificador != null ? `#${p.identificador}` : null,
  };
}

export const especieNome =(e?: { nomeComum?: string | null; nomeCientifico?: string | null } | null) =>
  e?.nomeComum || e?.nomeCientifico || 'Espécie desconhecida';

export const modoAquisicaoLabel = (m?: ModoAquisicao | null) =>
  MODOS_AQUISICAO.find((x) => x.value === m)?.label ?? '—';

/** Cor de faixa/selo e cor do texto sobre ela. */
export interface TomFaixa {
  cor: string;
  texto: string;
}

/** Cores por prioridade: alerta (debilitada, recém transplantada), preparação (pré-transplante), saúde (crescimento, refinamento). */
export const GRUPO_CORES: Record<GrupoPlanta, TomFaixa> = {
  DEBILITADA: { cor: '#C0392B', texto: '#FFFFFF' },
  RECEM_TRANSPLANTADA: { cor: '#E0911B', texto: '#3B2606' },
  PRE_TRANSPLANTE: { cor: '#5B6BD6', texto: '#FFFFFF' },
  EM_CRESCIMENTO: { cor: '#2F7D3A', texto: '#FFFFFF' },
  REFINAMENTO: { cor: '#A9D49B', texto: '#21451C' },
};

/** Faixa neutra (areia): sem grupo, espécie, tarefa. */
export const TOM_NEUTRO: TomFaixa = { cor: '#D6C0B3', texto: '#2B1F17' };

/** Estilo para `className="faixa"` ou `"selo"`. */
export const estiloFaixa = (tom: TomFaixa) => ({ '--faixa': tom.cor, color: tom.texto }) as CSSProperties;

export const grupoLabel = (g?: GrupoPlanta | null) => GRUPOS_PLANTA.find((x) => x.value === g)?.label ?? 'Sem grupo';

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
const fmtNumerica = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
/** "05/10/2026" */
export const dataNumerica = (iso: string) => fmtNumerica.format(new Date(iso));

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

export const daquiADias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();

/** Rótulo curto para identificar a planta: o ID (#14) tem prioridade. */
export const plantaRotulo = (p: PlantaRef) => (p?.identificador != null ? `#${p.identificador}` : plantaNome(p) || 'Planta');

/** Texto de busca de plantas: "#14" procura pelo número 14, como o ID aparece nas telas. */
export const termoDeBusca = (busca: string) => busca.trim().toLowerCase().replace(/^#\s*/, '');

/** "#14 · Ficus" — ID e nome juntos, para listas de escolha. */
export const plantaCodigoNome = (p: PlantaRef) =>
  [p?.identificador != null ? `#${p.identificador}` : null, plantaNome(p)].filter(Boolean).join(' · ') || 'Planta';

export interface GrupoAtividade {
  atividadeId: string;
  nome: string;
  agendas: Agenda[];
}

/** Agrupa por atividade; grupos e itens ordenados pela data mais antiga. */
export function agruparPorAtividade(agendas: Agenda[]): GrupoAtividade[] {
  const grupos = new Map<string, GrupoAtividade>();
  for (const a of [...agendas].sort((x, y) => x.dataAgendada.localeCompare(y.dataAgendada))) {
    const g = grupos.get(a.atividadeId) ?? { atividadeId: a.atividadeId, nome: a.atividade?.nome ?? 'Cuidado', agendas: [] };
    g.agendas.push(a);
    grupos.set(a.atividadeId, g);
  }
  return [...grupos.values()];
}
