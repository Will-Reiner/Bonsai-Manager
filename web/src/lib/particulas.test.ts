import { describe, expect, it } from 'vitest';
import {
  PARAMETROS,
  animacoesLigadas,
  cenaDaEstacao,
  desenho,
  estacaoDasParticulas,
  mover,
  saiuDaTela,
  sortearParticula,
  ventoNoTempo,
  type Sorteio,
} from './particulas';

/** Sorteio previsível: sempre o mesmo valor. */
const fixo = (v: number): Sorteio => () => v;
/** Sorteio pseudoaleatório com semente (LCG), para varrer muitos casos. */
function semente(s: number): Sorteio {
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('cenaDaEstacao', () => {
  it('primavera = 15 pétalas, outono = 10 folhas', () => {
    const p = cenaDaEstacao('PRIMAVERA')!;
    expect(p.tipo).toBe('petala');
    expect(p.sprites).toHaveLength(15);
    expect(p.sprites[0]).toBe('/arte/particulas/petala-1.webp');
    const o = cenaDaEstacao('OUTONO')!;
    expect(o.tipo).toBe('folha');
    expect(o.sprites).toHaveLength(10);
    expect(o.sprites[9]).toBe('/arte/particulas/folha-10.webp');
  });

  it('inverno = neve feita em código (sem imagens)', () => {
    expect(cenaDaEstacao('INVERNO')).toEqual({ tipo: 'neve', sprites: [] });
  });

  it('verão não tem partículas', () => {
    expect(cenaDaEstacao('VERAO')).toBeNull();
  });

  it('mesmo objeto a cada chamada (dependência estável)', () => {
    expect(cenaDaEstacao('OUTONO')).toBe(cenaDaEstacao('OUTONO'));
  });
});

describe('estacaoDasParticulas', () => {
  it('sem estação de teste, usa a real', () => {
    expect(estacaoDasParticulas('PRIMAVERA', null)).toBe('PRIMAVERA');
  });
  it('estação de teste válida substitui a real', () => {
    expect(estacaoDasParticulas('PRIMAVERA', 'INVERNO')).toBe('INVERNO');
  });
  it('valor estranho é ignorado', () => {
    expect(estacaoDasParticulas('OUTONO', 'nevasca')).toBe('OUTONO');
    expect(estacaoDasParticulas('OUTONO', 'toString')).toBe('OUTONO');
  });
});

describe('sortearParticula', () => {
  const folhas = cenaDaEstacao('OUTONO')!;

  it('tamanho em 17px ±35% e queda em ±30%', () => {
    const r = semente(7);
    for (let i = 0; i < 300; i++) {
      const p = sortearParticula(folhas, 390, 800, r, true);
      expect(p.tamanho).toBeGreaterThanOrEqual(17 * 0.65);
      expect(p.tamanho).toBeLessThanOrEqual(17 * 1.35);
      expect(p.queda).toBeGreaterThanOrEqual(0.7);
      expect(p.queda).toBeLessThanOrEqual(1.3);
      expect(folhas.sprites).toContain(p.sprite);
    }
  });

  it('no começo espalha pela tela inteira; na reposição nasce acima do topo', () => {
    const r = semente(3);
    const inicio = Array.from({ length: 200 }, () => sortearParticula(folhas, 390, 800, r, true));
    expect(Math.max(...inicio.map((p) => p.y))).toBeGreaterThan(400);
    const repostas = Array.from({ length: 200 }, () => sortearParticula(folhas, 390, 800, r, false));
    for (const p of repostas) expect(p.y).toBeLessThan(0);
  });

  it('nasce dentro da largura (com folga de 20px à esquerda)', () => {
    expect(sortearParticula(folhas, 390, 800, fixo(0), true).x).toBe(-20);
    expect(sortearParticula(folhas, 390, 800, fixo(0.999999), true).x).toBeCloseTo(390, 2);
  });

  it('neve não tem imagem e é menor que folha', () => {
    const neve = sortearParticula(cenaDaEstacao('INVERNO')!, 390, 800, fixo(0.5), true);
    const folha = sortearParticula(folhas, 390, 800, fixo(0.5), true);
    expect(neve.sprite).toBeNull();
    expect(neve.tamanho).toBeLessThan(folha.tamanho);
  });
});

describe('mover', () => {
  const p = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);

  it('cai a 112 × 0,55 × queda px/s e o vento empurra para o lado', () => {
    const q = mover(p, 0.05, 10);
    expect(q.y - p.y).toBeCloseTo(112 * 0.55 * p.queda * 0.05, 5);
    expect(q.x - p.x).toBeCloseTo(10 * 0.05, 5);
    expect(q).not.toBe(p);
  });

  it('dt grande (aba voltando do fundo) é limitado: sem salto', () => {
    const q = mover(p, 5, 0);
    expect(q.y - p.y).toBeCloseTo(112 * 0.55 * p.queda * PARAMETROS.dtMaximo, 5);
  });
});

describe('ventoNoTempo', () => {
  it('vento de 40% oscila entre 0,2 e 1 × 0,4 × 28 px/s, sempre para a direita', () => {
    for (let t = 0; t < 60; t += 0.7) {
      const v = ventoNoTempo(t);
      expect(v).toBeGreaterThanOrEqual(0.4 * 28 * 0.2 - 1e-9);
      expect(v).toBeLessThanOrEqual(0.4 * 28 + 1e-9);
    }
  });
});

describe('desenho', () => {
  const p = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);

  it('folha vira de lado: scaleX entre 0,35 e 1', () => {
    for (let t = 0; t < 20; t += 0.3) {
      const d = desenho(p, t, 'folha');
      expect(d.escalaX).toBeGreaterThanOrEqual(0.35);
      expect(d.escalaX).toBeLessThanOrEqual(1);
      expect(d.y).toBe(p.y);
    }
  });

  it('neve não gira nem vira', () => {
    const d = desenho(p, 3, 'neve');
    expect(d.rotacao).toBe(0);
    expect(d.escalaX).toBe(1);
  });
});

describe('saiuDaTela', () => {
  const base = sortearParticula(cenaDaEstacao('OUTONO')!, 390, 800, fixo(0.5), true);
  it('abaixo do fundo (com folga) ou passou da direita → repor', () => {
    expect(saiuDaTela({ ...base, y: 841 }, 390, 800)).toBe(true);
    expect(saiuDaTela({ ...base, x: 451 }, 390, 800)).toBe(true);
  });
  it('ainda caindo na tela → fica', () => {
    expect(saiuDaTela({ ...base, x: 200, y: 400 }, 390, 800)).toBe(false);
    expect(saiuDaTela({ ...base, x: 200, y: -60 }, 390, 800)).toBe(false);
  });
});

describe('animacoesLigadas', () => {
  const cena = cenaDaEstacao('OUTONO');
  it('ligadas por padrão, com movimento normal', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: false, cena })).toBe(true);
  });
  it('preferência desligada → desligadas', () => {
    expect(animacoesLigadas({ preferencia: 'nao', menosMovimento: false, cena })).toBe(false);
  });
  it('sistema pede menos movimento → desligadas', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: true, cena })).toBe(false);
  });
  it('verão (sem cena) → nada para desenhar', () => {
    expect(animacoesLigadas({ preferencia: 'sim', menosMovimento: false, cena: null })).toBe(false);
  });
});
