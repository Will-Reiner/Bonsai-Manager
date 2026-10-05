import { toDateInput } from './format';

/** Estações no hemisfério sul (Brasil) — aproximação das datas astronômicas, [mês, dia]. */
const ESTACOES = [
  { nome: 'da primavera', comeco: [9, 22], final: [12, 20] },
  { nome: 'do verão', comeco: [12, 21], final: [3, 19] },
  { nome: 'do outono', comeco: [3, 20], final: [6, 20] },
  { nome: 'do inverno', comeco: [6, 21], final: [9, 21] },
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
