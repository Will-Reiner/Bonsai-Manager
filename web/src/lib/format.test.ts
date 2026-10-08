import { describe, expect, it } from 'vitest';
import { plantaCodigoNome, plantaNome, plantaRotulo, plantaTitulo } from './format';

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
