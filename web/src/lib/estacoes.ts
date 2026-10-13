import { toDateInput } from './format';
import type { Estacao } from '@/types';

/** Estações no hemisfério sul (Brasil) — aproximação das datas astronômicas, [mês, dia]. */
const ESTACOES = [
  { estacao: 'PRIMAVERA', nome: 'da primavera', comeco: [9, 22], final: [12, 20] },
  { estacao: 'VERAO', nome: 'do verão', comeco: [12, 21], final: [3, 19] },
  { estacao: 'OUTONO', nome: 'do outono', comeco: [3, 20], final: [6, 20] },
  { estacao: 'INVERNO', nome: 'do inverno', comeco: [6, 21], final: [9, 21] },
] as const;

const meioDia = (ano: number, mes0: number, dia: number) => new Date(ano, mes0, dia, 12);

/** Próxima ocorrência de [mês, dia] a partir de amanhã. */
export function proximaOcorrencia([mes, dia]: readonly [number, number], hoje = new Date()): Date {
  const amanha = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const esteAno = meioDia(hoje.getFullYear(), mes - 1, dia);
  return esteAno >= amanha ? esteAno : meioDia(hoje.getFullYear() + 1, mes - 1, dia);
}

/** Soma meses de calendário; 31/01 + 1 mês = 28/02 (ou 29). */
export function somarMeses(base: Date, meses: number): Date {
  const alvo = meioDia(base.getFullYear(), base.getMonth() + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(base.getDate(), ultimoDia));
  return alvo;
}

export interface AtalhoData {
  label: string;
  /** AAAA-MM-DD, pronto para <input type="date"> */
  data: string;
}

/** Atalhos do agendamento: prazos curtos + começo/final de cada estação (sempre a próxima). */
export function atalhosDeData(hoje = new Date()): AtalhoData[] {
  const base = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const emDias = (n: number) => meioDia(base.getFullYear(), base.getMonth(), base.getDate() + n);
  const iso = (d: Date) => toDateInput(d.toISOString());
  return [
    { label: 'Amanhã', data: iso(emDias(1)) },
    { label: '1 semana', data: iso(emDias(7)) },
    { label: '1 mês', data: iso(somarMeses(base, 1)) },
    { label: '3 meses', data: iso(somarMeses(base, 3)) },
    ...ESTACOES.flatMap((e) => [
      { label: `Começo ${e.nome}`, data: iso(proximaOcorrencia(e.comeco, hoje)) },
      { label: `Final ${e.nome}`, data: iso(proximaOcorrencia(e.final, hoje)) },
    ]),
  ];
}

/** Último dia da estação atual (o "final" mais próximo a partir de hoje, inclusive). */
export function fimDaEstacao(hoje = new Date()): Date {
  const ontem = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  return ESTACOES.map((e) => proximaOcorrencia(e.final, ontem)).reduce((a, b) => (b < a ? b : a));
}

export interface EstacaoAtual {
  estacao: Estacao;
  proxima: Estacao;
  diasParaProxima: number;
  /** 0 no primeiro dia, perto de 1 na véspera da próxima. */
  progresso: number;
}

const DIA_MS = 86_400_000;

/** Estação de hoje, quanto dela já passou e quantos dias faltam para a próxima. */
export function estacaoAtual(hoje = new Date()): EstacaoAtual {
  const base = meioDia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Começo mais recente (inclusive hoje) de cada estação; a atual é a que começou por último
  const ontem = meioDia(base.getFullYear(), base.getMonth(), base.getDate() - 1);
  const inicios = ESTACOES.map((e) => {
    const proximo = proximaOcorrencia(e.comeco, ontem);
    return proximo <= base ? proximo : meioDia(proximo.getFullYear() - 1, proximo.getMonth(), proximo.getDate());
  });
  const i = inicios.reduce((m, d, j) => (d > inicios[m] ? j : m), 0);
  const seguinte = ESTACOES[(i + 1) % ESTACOES.length];
  const fim = proximaOcorrencia(seguinte.comeco, base);
  const dias = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DIA_MS);
  return {
    estacao: ESTACOES[i].estacao,
    proxima: seguinte.estacao,
    diasParaProxima: dias(base, fim),
    progresso: dias(inicios[i], base) / dias(inicios[i], fim),
  };
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const porExtenso = ([mes, dia]: readonly [number, number]) => `${dia} de ${MESES[mes - 1]}`;

/** "22 de setembro a 20 de dezembro". */
export function periodoDaEstacao(e: Estacao): string {
  const { comeco, final } = ESTACOES.find((x) => x.estacao === e)!;
  return `${porExtenso(comeco)} a ${porExtenso(final)}`;
}

const COM_ARTIGO: Record<Estacao, string> = { PRIMAVERA: 'a primavera', VERAO: 'o verão', OUTONO: 'o outono', INVERNO: 'o inverno' };

/** "70 dias para o verão" / "amanhã começa o verão". */
export function faltaParaProxima({ proxima, diasParaProxima }: Pick<EstacaoAtual, 'proxima' | 'diasParaProxima'>): string {
  return diasParaProxima === 1 ? `amanhã começa ${COM_ARTIGO[proxima]}` : `${diasParaProxima} dias para ${COM_ARTIGO[proxima]}`;
}
