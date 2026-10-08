import { describe, expect, it } from 'vitest';
import { plantaCodigoNome, plantaNome, plantaRotulo, plantaTitulo, subtituloDaColecao, termoDeBusca } from './format';

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
