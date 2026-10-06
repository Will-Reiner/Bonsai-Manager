/** Estações do hemisfério sul com datas fixas de início. Única fonte de "em que estação estamos" (trocável no futuro). */
export type Estacao = 'PRIMAVERA' | 'VERAO' | 'OUTONO' | 'INVERNO';

export const ESTACOES: Estacao[] = ['PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO'];

/** Início de cada estação: [estação, mês (1-12), dia]. */
const INICIOS: [Estacao, number, number][] = [
  ['OUTONO', 3, 20],
  ['INVERNO', 6, 21],
  ['PRIMAVERA', 9, 22],
  ['VERAO', 12, 21],
];

/** Hora usada nas datas geradas: meio-dia de Brasília. */
const HORA_UTC = 15;

/** Estação da data (dia em UTC). */
export function estacaoDe(data: Date): Estacao {
  const md = (data.getUTCMonth() + 1) * 100 + data.getUTCDate();
  if (md >= 1221 || md < 320) return 'VERAO';
  if (md < 621) return 'OUTONO';
  if (md < 922) return 'INVERNO';
  return 'PRIMAVERA';
}

/** Primeiro início (15h UTC) de uma das estações ativas a partir de `aPartirDe`. */
export function proximoInicioDeEstacao(ativas: Estacao[], aPartirDe: Date): Date {
  const ano = aPartirDe.getUTCFullYear();
  const candidatos = [ano, ano + 1].flatMap((a) =>
    INICIOS.filter(([e]) => ativas.includes(e)).map(([, mes, dia]) => Date.UTC(a, mes - 1, dia, HORA_UTC)),
  );
  return new Date(Math.min(...candidatos.filter((t) => t >= aPartirDe.getTime())));
}
