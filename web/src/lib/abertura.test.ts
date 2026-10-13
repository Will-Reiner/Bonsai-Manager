import { describe, expect, it } from 'vitest';
import { faseInicial, proximaFase } from './abertura';

describe('faseInicial', () => {
  it('primeira vez na sessão: vídeo', () => {
    expect(faseInicial({ jaVista: false, menosMovimento: false })).toBe('video');
  });

  it('com movimento reduzido: só a marca', () => {
    expect(faseInicial({ jaVista: false, menosMovimento: true })).toBe('marca');
  });

  it('já vista nesta sessão: nada', () => {
    expect(faseInicial({ jaVista: true, menosMovimento: false })).toBe('fim');
    expect(faseInicial({ jaVista: true, menosMovimento: true })).toBe('fim');
  });
});

describe('proximaFase', () => {
  it('o vídeo chega ao ponto da marca, falha ou é tocado: mostra a marca', () => {
    expect(proximaFase('video', 'marca')).toBe('marca');
    expect(proximaFase('video', 'falhou')).toBe('marca');
    expect(proximaFase('video', 'toque')).toBe('marca');
  });

  it('a marca some no tempo ou ao tocar', () => {
    expect(proximaFase('marca', 'tempo')).toBe('saindo');
    expect(proximaFase('marca', 'toque')).toBe('saindo');
  });

  it('saindo termina quando o fade acaba', () => {
    expect(proximaFase('saindo', 'saiu')).toBe('fim');
  });

  it('eventos fora de hora não mudam a fase', () => {
    expect(proximaFase('video', 'tempo')).toBe('video');
    expect(proximaFase('video', 'saiu')).toBe('video');
    expect(proximaFase('marca', 'marca')).toBe('marca');
    expect(proximaFase('marca', 'falhou')).toBe('marca');
    expect(proximaFase('saindo', 'toque')).toBe('saindo');
    expect(proximaFase('fim', 'toque')).toBe('fim');
  });
});
