import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dataCurta, distanciaRelativa, plantaCodigoNome, tempoRelativo, plantaNome, plantaRotulo, plantaTitulo, subtituloDaColecao, termoDeBusca } from './format';

const ficus = { nomeComum: 'Ficus', nomeCientifico: 'Ficus microcarpa' };

describe('plantaNome', () => {
  it('apelido, depois nome comum, depois científico', () => {
    expect(plantaNome({ nome: 'Vovó', identificador: 3, especie: ficus })).toBe('Vovó');
    expect(plantaNome({ identificador: 3, especie: ficus })).toBe('Ficus');
    expect(plantaNome({ identificador: 3, especie: { nomeCientifico: 'Ficus microcarpa' } })).toBe('Ficus microcarpa');
  });

  it('sem apelido nem espécie: null (o ID não é nome)', () => {
    expect(plantaNome({ identificador: 3 })).toBeNull();
  });
});

describe('plantaTitulo', () => {
  it('usa o nome quando há', () => {
    expect(plantaTitulo({ nome: 'Vovó', identificador: 3 })).toBe('Vovó');
    expect(plantaTitulo({ identificador: 3, especie: ficus })).toBe('Ficus');
  });

  it('sem nome nem espécie: "Planta #N"', () => {
    expect(plantaTitulo({ identificador: 14 })).toBe('Planta #14');
  });

  it('sem nada', () => {
    expect(plantaTitulo(undefined)).toBe('Planta sem nome');
  });
});

describe('plantaRotulo', () => {
  it('o ID tem prioridade, com #', () => {
    expect(plantaRotulo({ nome: 'Vovó', identificador: 3 })).toBe('#3');
  });

  it('sem ID cai no nome', () => {
    expect(plantaRotulo({ nome: 'Vovó' })).toBe('Vovó');
    expect(plantaRotulo(null)).toBe('Planta');
  });
});

describe('plantaCodigoNome', () => {
  it('"#N · nome"', () => {
    expect(plantaCodigoNome({ identificador: 3, especie: ficus })).toBe('#3 · Ficus');
  });

  it('sem nome nem espécie não repete o ID', () => {
    expect(plantaCodigoNome({ identificador: 14 })).toBe('#14');
  });

  it('sem nada', () => {
    expect(plantaCodigoNome(undefined)).toBe('Planta');
  });
});

describe('termoDeBusca', () => {
  it('minúsculo, sem espaços nas pontas', () => {
    expect(termoDeBusca('  Ficus ')).toBe('ficus');
  });

  it('"#14" busca pelo número (o ID aparece como #N nas telas)', () => {
    expect(termoDeBusca('#14')).toBe('14');
    expect(termoDeBusca(' # 14')).toBe('14');
  });
});

describe('subtituloDaColecao', () => {
  it('com nome: espécie e #N', () => {
    expect(subtituloDaColecao({ nome: 'Vovó', identificador: 3, especieId: 'e1', especie: ficus })).toEqual({ especie: true, codigo: '#3' });
    expect(subtituloDaColecao({ nome: 'Vovó', identificador: 3 })).toEqual({ especie: true, codigo: '#3' });
  });

  it('sem nome, com espécie: a espécie já é o título, fica só o #N', () => {
    expect(subtituloDaColecao({ identificador: 3, especieId: 'e1', especie: ficus })).toEqual({ especie: false, codigo: '#3' });
  });

  it('sem nome nem espécie: o título já é "Planta #N", fica só o aviso da espécie', () => {
    expect(subtituloDaColecao({ identificador: 14 })).toEqual({ especie: true, codigo: null });
  });
});

describe('distanciaRelativa', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 15, 0));
  });
  afterEach(() => vi.useRealTimers());
  const dia = (d: number, m = 9, a = 2026) => new Date(a, m, d, 10, 0).toISOString();

  it('hoje, amanhã e ontem', () => {
    expect(distanciaRelativa(dia(12))).toBe('Hoje');
    expect(distanciaRelativa(dia(13))).toBe('Amanhã');
    expect(distanciaRelativa(dia(11))).toBe('Ontem');
  });

  it('dias no futuro e no passado', () => {
    expect(distanciaRelativa(dia(22))).toBe('Daqui 10 dias');
    expect(distanciaRelativa(dia(2))).toBe('10 dias atrás');
  });

  it('meses a partir de 30 dias', () => {
    expect(distanciaRelativa(dia(11, 10))).toBe('Daqui 1 mês');
    expect(distanciaRelativa(dia(12, 8))).toBe('1 mês atrás');
    expect(distanciaRelativa(dia(12, 6))).toBe('3 meses atrás');
  });

  it('anos a partir de 365 dias', () => {
    expect(distanciaRelativa(dia(12, 9, 2025))).toBe('1 ano atrás');
    expect(distanciaRelativa(dia(1, 0, 2024))).toBe('2 anos atrás');
  });
});


describe('tempoRelativo', () => {
  const agora = new Date('2026-10-13T15:00:00');
  it.each([
    ['2026-10-13T14:59:40', 'agora'],
    ['2026-10-13T14:55:00', 'há 5 min'],
    ['2026-10-13T12:00:00', 'há 3 h'],
    ['2026-10-12T14:00:00', 'ontem'],
    ['2026-10-10T15:00:00', 'há 3 dias'],
  ])('%s → %s', (iso, esperado) => {
    expect(tempoRelativo(iso, agora)).toBe(esperado);
  });
  it('depois de uma semana, a data curta', () => {
    expect(tempoRelativo('2026-09-01T15:00:00', agora)).toBe(dataCurta('2026-09-01T15:00:00'));
  });
});
