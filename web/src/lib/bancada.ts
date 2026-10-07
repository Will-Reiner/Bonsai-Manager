import { GRUPOS_PLANTA, type Agenda, type GrupoPlanta, type Planta } from '@/types';
import { GRUPO_CORES, TOM_NEUTRO, agruparPorAtividade, diasAte, especieNome, grupoLabel, type GrupoAtividade, type TomFaixa } from './format';
import { fimDaEstacao } from './estacoes';

export type Periodo = 'semana' | 'mes' | 'estacao' | 'todas';
export type Agrupar = 'grupos' | 'tarefas' | 'especies';

export const PERIODOS: { value: Periodo; label: string; vazio: string }[] = [
  { value: 'semana', label: 'Esta semana', vazio: 'nos próximos 7 dias' },
  { value: 'mes', label: 'Este mês', vazio: 'neste mês' },
  { value: 'estacao', label: 'Esta estação', vazio: 'nesta estação' },
  { value: 'todas', label: 'Todas', vazio: 'por enquanto' },
];

export const AGRUPAMENTOS: { value: Agrupar; label: string }[] = [
  { value: 'grupos', label: 'Por grupo' },
  { value: 'tarefas', label: 'Por tarefa' },
  { value: 'especies', label: 'Por espécie' },
];

/** Último dia incluído no período, em dias a partir de hoje; null = sem limite. */
function limiteDoPeriodo(periodo: Periodo): number | null {
  const hoje = new Date();
  if (periodo === 'semana') return 6;
  if (periodo === 'mes') return diasAte(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12).toISOString());
  if (periodo === 'estacao') return diasAte(fimDaEstacao(hoje).toISOString());
  return null;
}

/** Pendentes da bancada: atrasadas (sempre) e próximas dentro do período. */
export function tarefasDaBancada(agendas: Agenda[], periodo: Periodo) {
  const pendentes = agendas.filter((a) => a.status === 'PENDENTE');
  const limite = limiteDoPeriodo(periodo);
  return {
    atrasadas: pendentes.filter((a) => diasAte(a.dataAgendada) < 0),
    proximas: pendentes.filter((a) => {
      const d = diasAte(a.dataAgendada);
      return d >= 0 && (limite === null || d <= limite);
    }),
  };
}

export interface Bloco {
  chave: string;
  /** null = sem cabeçalho (modo "por tarefa") */
  titulo: string | null;
  /** Cor da faixa do cabeçalho; null = sem cabeçalho */
  cor: TomFaixa | null;
  grupos: GrupoAtividade[];
}

/** Blocos por grupo da planta (ordem fixa) ou espécie (A–Z), com as tarefas agrupadas por atividade dentro. */
export function blocosDaBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): Bloco[] {
  if (!agendas.length) return [];
  if (modo === 'tarefas') return [{ chave: 'tarefas', titulo: null, cor: null, grupos: agruparPorAtividade(agendas) }];

  const chaveDe = (a: Agenda) => {
    const p = plantas.get(a.plantaId);
    return (modo === 'grupos' ? p?.grupo : p?.especieId) ?? '';
  };
  const porChave = new Map<string, Agenda[]>();
  for (const a of agendas) {
    const k = chaveDe(a);
    porChave.set(k, [...(porChave.get(k) ?? []), a]);
  }
  const titulo = (k: string) =>
    modo === 'grupos'
      ? grupoLabel(k ? (k as Planta['grupo']) : null)
      : k
        ? especieNome(plantas.get(porChave.get(k)![0].plantaId)?.especie)
        : 'Sem espécie';
  const cor = (k: string) => (modo === 'grupos' && k ? GRUPO_CORES[k as GrupoPlanta] : TOM_NEUTRO);
  const ordem =
    modo === 'grupos'
      ? [...GRUPOS_PLANTA.map((g) => g.value as string), '']
      : [...[...porChave.keys()].filter(Boolean).sort((a, b) => titulo(a).localeCompare(titulo(b), 'pt-BR')), ''];
  return ordem
    .filter((k) => porChave.has(k))
    .map((k) => ({ chave: k || 'sem', titulo: titulo(k), cor: cor(k), grupos: agruparPorAtividade(porChave.get(k)!) }));
}
