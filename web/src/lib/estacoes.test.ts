import { describe, expect, it } from 'vitest';
import { estacaoAtual, faltaParaProxima, periodoDaEstacao } from './estacoes';

const em = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia, 15);

describe('estacaoAtual', () => {
  it('primavera em outubro, com dias até o verão', () => {
    const e = estacaoAtual(em(2026, 10, 12));
    expect(e.estacao).toBe('PRIMAVERA');
    expect(e.proxima).toBe('VERAO');
    expect(e.diasParaProxima).toBe(70); // 21/12
    expect(e.progresso).toBeGreaterThan(0.2);
    expect(e.progresso).toBeLessThan(0.25);
  });

  it('verão atravessa a virada do ano', () => {
    const e = estacaoAtual(em(2027, 1, 10));
    expect(e.estacao).toBe('VERAO');
    expect(e.proxima).toBe('OUTONO');
    expect(e.diasParaProxima).toBe(69); // 20/03
  });

  it('no primeiro dia a estação já é a nova, com progresso zero', () => {
    const e = estacaoAtual(em(2026, 6, 21));
    expect(e.estacao).toBe('INVERNO');
    expect(e.progresso).toBe(0);
  });

  it('na véspera falta 1 dia para a próxima', () => {
    const e = estacaoAtual(em(2026, 9, 21));
    expect(e.estacao).toBe('INVERNO');
    expect(e.diasParaProxima).toBe(1);
  });
});

describe('periodoDaEstacao', () => {
  it('datas de começo e fim por extenso', () => {
    expect(periodoDaEstacao('PRIMAVERA')).toBe('22 de setembro a 20 de dezembro');
    expect(periodoDaEstacao('VERAO')).toBe('21 de dezembro a 19 de março');
    expect(periodoDaEstacao('OUTONO')).toBe('20 de março a 20 de junho');
    expect(periodoDaEstacao('INVERNO')).toBe('21 de junho a 21 de setembro');
  });
});

describe('faltaParaProxima', () => {
  it('dias até a próxima, com artigo', () => {
    expect(faltaParaProxima({ proxima: 'VERAO', diasParaProxima: 70 })).toBe('70 dias para o verão');
    expect(faltaParaProxima({ proxima: 'PRIMAVERA', diasParaProxima: 12 })).toBe('12 dias para a primavera');
  });
  it('véspera: "amanhã começa"', () => {
    expect(faltaParaProxima({ proxima: 'INVERNO', diasParaProxima: 1 })).toBe('amanhã começa o inverno');
  });
});
