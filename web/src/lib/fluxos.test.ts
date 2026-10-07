import { describe, expect, it } from 'vitest';
import { etapaValida, fluxoAgendar, fluxoConcluir, fluxoRegistrar, resumoMaisOpcoes, type Fluxo } from './fluxos';

const base = { temFotos: false, temPlantas: false, plantaFixa: false, temTipos: false, temCandidatas: false };

describe('fluxoRegistrar', () => {
  it('sem fotos nem plantas só libera o início', () => {
    expect(fluxoRegistrar(base)).toEqual({ sequencia: ['inicio', 'feito', 'final'], alcance: 1 });
  });
  it('com fotos ainda sem planta libera até a triagem', () => {
    expect(fluxoRegistrar({ ...base, temFotos: true })).toEqual({
      sequencia: ['inicio', 'triagem', 'feito', 'final'],
      alcance: 2,
    });
  });
  it('planta fixa pula a triagem', () => {
    const f = fluxoRegistrar({ ...base, temFotos: true, temPlantas: true, plantaFixa: true });
    expect(f.sequencia).toEqual(['inicio', 'feito', 'final']);
    expect(f.alcance).toBe(2);
  });
  it('sem tipos escolhidos para no "feito"', () => {
    expect(fluxoRegistrar({ ...base, temFotos: true, temPlantas: true }).alcance).toBe(3);
  });
  it('tarefas só aparece com candidatas; com tipos libera tudo', () => {
    expect(fluxoRegistrar({ ...base, temPlantas: true, temTipos: true, temCandidatas: true })).toEqual({
      sequencia: ['inicio', 'feito', 'tarefas', 'final'],
      alcance: 4,
    });
  });
});

describe('fluxoConcluir', () => {
  it('sem plantas marcadas fica no procedimento', () => {
    expect(fluxoConcluir({ temMarcadas: false })).toEqual({ sequencia: ['procedimento', 'final'], alcance: 1 });
  });
  it('com plantas marcadas libera o final', () => {
    expect(fluxoConcluir({ temMarcadas: true }).alcance).toBe(2);
  });
});

describe('fluxoAgendar', () => {
  it('sem planta fixa começa escolhendo plantas', () => {
    expect(fluxoAgendar({ plantaFixa: false, temPlantas: false, temCuidados: false })).toEqual({
      sequencia: ['plantas', 'cuidados', 'quando'],
      alcance: 1,
    });
  });
  it('com plantas e sem cuidados para em "cuidados"', () => {
    expect(fluxoAgendar({ plantaFixa: false, temPlantas: true, temCuidados: false }).alcance).toBe(2);
  });
  it('planta fixa pula a escolha de plantas', () => {
    expect(fluxoAgendar({ plantaFixa: true, temPlantas: true, temCuidados: true })).toEqual({
      sequencia: ['cuidados', 'quando'],
      alcance: 2,
    });
  });
});

describe('etapaValida', () => {
  const f: Fluxo<'a' | 'b' | 'c' | 'x'> = { sequencia: ['a', 'b', 'c'], alcance: 2 };
  it('sem etapa pedida → primeira', () => expect(etapaValida(f, [], null)).toBe('a'));
  it('pedida liberada → ela', () => expect(etapaValida(f, [], 'b')).toBe('b'));
  it('pedida além do alcance → última liberada', () => expect(etapaValida(f, [], 'c')).toBe('b'));
  it('desconhecida → última liberada', () => expect(etapaValida(f, [], 'zzz')).toBe('b'));
  it('desvio permitido → ele', () => expect(etapaValida(f, ['x'], 'x')).toBe('x'));
  it('desvio não permitido → última liberada', () => expect(etapaValida(f, [], 'x')).toBe('b'));
});

describe('resumoMaisOpcoes', () => {
  it('junta só os itens preenchidos', () => {
    expect(resumoMaisOpcoes(['Nota', '', false, null, undefined, '1 próximo passo'])).toBe('Nota · 1 próximo passo');
  });
  it('nada preenchido → vazio', () => expect(resumoMaisOpcoes([false, ''])).toBe(''));
});
