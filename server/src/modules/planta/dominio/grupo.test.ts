import { aplicarTransplante, diasDeTransplante, trocaManual, TRANSPLANTE_PADRAO_DIAS } from './grupo';

const DIA = 86_400_000;
const DATA = new Date('2026-10-06T12:00:00.000Z');

describe('aplicarTransplante', () => {
  it('guarda o grupo atual e move para Recém transplantada até data + dias', () => {
    expect(aplicarTransplante({ grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null }, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'REFINAMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('planta sem grupo volta para sem grupo', () => {
    expect(aplicarTransplante({ grupo: null, grupoAnterior: null, grupoExpiraEm: null }, DATA, 10).grupoAnterior).toBeNull();
  });

  it('novo transplante durante o prazo recomeça o prazo e mantém o grupo de retorno original', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: 'EM_CRESCIMENTO' as const, grupoExpiraEm: new Date(DATA.getTime() + 3 * DIA) };
    expect(aplicarTransplante(antes, DATA, 15)).toEqual({
      grupo: 'RECEM_TRANSPLANTADA',
      grupoAnterior: 'EM_CRESCIMENTO',
      grupoExpiraEm: new Date(DATA.getTime() + 15 * DIA),
    });
  });

  it('Recém transplantada escolhida à mão (sem retorno) continua sem retorno', () => {
    const antes = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: null, grupoExpiraEm: null };
    expect(aplicarTransplante(antes, DATA, 15).grupoAnterior).toBeNull();
  });
});

describe('trocaManual', () => {
  it('define o grupo e cancela o retorno automático', () => {
    expect(trocaManual('DEBILITADA')).toEqual({ grupo: 'DEBILITADA', grupoAnterior: null, grupoExpiraEm: null });
    expect(trocaManual(null)).toEqual({ grupo: null, grupoAnterior: null, grupoExpiraEm: null });
  });
});

describe('diasDeTransplante', () => {
  it('usa o padrão sem preferência ou com valor inválido', () => {
    expect(diasDeTransplante(undefined)).toBe(TRANSPLANTE_PADRAO_DIAS);
    expect(diasDeTransplante('abc')).toBe(TRANSPLANTE_PADRAO_DIAS);
  });

  it('limita entre 1 e 365', () => {
    expect(diasDeTransplante('30')).toBe(30);
    expect(diasDeTransplante('0')).toBe(1);
    expect(diasDeTransplante('9999')).toBe(365);
  });
});
