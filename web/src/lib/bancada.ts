import { GRUPOS_PLANTA, type Agenda, type GrupoPlanta, type Planta } from '@/types';
import {
  GRUPO_CORES,
  TOM_NEUTRO,
  agruparPorAtividade,
  diasAte,
  especieNome,
  grupoLabel,
  type GrupoAtividade,
  type TomFaixa,
} from './format';
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

export type View = 'lista' | 'fotos';

export const VIEWS_BANCADA: { value: View; label: string }[] = [
  { value: 'fotos', label: 'Fotos' },
  { value: 'lista', label: 'Lista' },
];

export const ehAtrasada = (a: Agenda) => diasAte(a.dataAgendada) < 0;

/** Último dia incluído no período, em dias a partir de hoje; null = sem limite. */
function limiteDoPeriodo(periodo: Periodo): number | null {
  const hoje = new Date();
  if (periodo === 'semana') return 6;
  if (periodo === 'mes') return diasAte(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12).toISOString());
  if (periodo === 'estacao') return diasAte(fimDaEstacao(hoje).toISOString());
  return null;
}

/** Pendentes da bancada: atrasadas (sempre) e as que vencem dentro do período. */
export function pendentesDaBancada(agendas: Agenda[], periodo: Periodo): Agenda[] {
  const limite = limiteDoPeriodo(periodo);
  return agendas.filter((a) => {
    if (a.status !== 'PENDENTE') return false;
    const d = diasAte(a.dataAgendada);
    return d < 0 || limite === null || d <= limite;
  });
}

export interface BlocoBancada {
  chave: string;
  titulo: string;
  tom: TomFaixa;
  total: number;
  atrasadas: number;
  /** Tarefas por atividade (data mais antiga primeiro); no modo "por tarefa", só uma. */
  grupos: GrupoAtividade[];
}

function bloco(chave: string, titulo: string, tom: TomFaixa, agendas: Agenda[]): BlocoBancada {
  return {
    chave,
    titulo,
    tom,
    total: agendas.length,
    atrasadas: agendas.filter(ehAtrasada).length,
    grupos: agruparPorAtividade(agendas),
  };
}

/** Blocos com atrasadas primeiro; entre si, mantém a ordem recebida. */
const atrasadasPrimeiro = (blocos: BlocoBancada[]) =>
  [...blocos].sort((a, b) => Number(b.atrasadas > 0) - Number(a.atrasadas > 0));

/** Bancada em blocos: por grupo (ordem de prioridade), por tarefa ou por espécie (A–Z); blocos com atrasadas sobem. */
export function montarBancada(agendas: Agenda[], modo: Agrupar, plantas: Map<string, Planta>): BlocoBancada[] {
  if (!agendas.length) return [];

  if (modo === 'tarefas') {
    return atrasadasPrimeiro(
      agruparPorAtividade(agendas).map((g) => bloco(g.atividadeId, g.nome, TOM_NEUTRO, g.agendas)),
    );
  }

  const chaveDe = (a: Agenda) => {
    const p = plantas.get(a.plantaId);
    return (modo === 'grupos' ? p?.grupo : p?.especieId) ?? '';
  };
  const porChave = new Map<string, Agenda[]>();
  for (const a of agendas) {
    const k = chaveDe(a);
    porChave.set(k, [...(porChave.get(k) ?? []), a]);
  }

  if (modo === 'grupos') {
    const ordem = [...GRUPOS_PLANTA.map((g) => g.value as string), ''];
    return atrasadasPrimeiro(
      ordem
        .filter((k) => porChave.has(k))
        .map((k) =>
          k
            ? bloco(k, grupoLabel(k as GrupoPlanta), GRUPO_CORES[k as GrupoPlanta], porChave.get(k)!)
            : bloco('sem', grupoLabel(null), TOM_NEUTRO, porChave.get(k)!),
        ),
    );
  }

  const nomeEspecie = (k: string) => especieNome(plantas.get(porChave.get(k)![0].plantaId)?.especie);
  const especies = [...porChave.keys()].filter(Boolean).sort((a, b) => nomeEspecie(a).localeCompare(nomeEspecie(b), 'pt-BR'));
  return atrasadasPrimeiro([
    ...especies.map((k) => bloco(k, nomeEspecie(k), TOM_NEUTRO, porChave.get(k)!)),
    ...(porChave.has('') ? [bloco('sem', 'Sem espécie', TOM_NEUTRO, porChave.get('')!)] : []),
  ]);
}
