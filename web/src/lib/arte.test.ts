import { describe, expect, it } from 'vitest';
import { TOTAL_VASOS, ilustracaoDaEstacao, vasoDaPlanta } from './arte';

describe('vasoDaPlanta', () => {
  it('a mesma planta tem sempre o mesmo vaso', () => {
    const id = '2ea702b2-4f39-475d-95d0-9b4bb8f30880';
    expect(vasoDaPlanta(id)).toBe(vasoDaPlanta(id));
  });

  it('aponta para um dos vasos em /arte/vasos', () => {
    expect(vasoDaPlanta('abc')).toMatch(/^\/arte\/vasos\/vaso-[1-7]\.webp$/);
  });

  it('ids diferentes espalham pelos 7 vasos', () => {
    const usados = new Set(Array.from({ length: 200 }, (_, i) => vasoDaPlanta(`planta-${i}-${i * 7919}`)));
    expect(usados.size).toBe(TOTAL_VASOS);
  });
});

describe('ilustracaoDaEstacao', () => {
  it('uma ilustração por estação, sem acento no nome do arquivo', () => {
    expect(ilustracaoDaEstacao('PRIMAVERA')).toBe('/arte/estacao-primavera.webp');
    expect(ilustracaoDaEstacao('VERAO')).toBe('/arte/estacao-verao.webp');
    expect(ilustracaoDaEstacao('OUTONO')).toBe('/arte/estacao-outono.webp');
    expect(ilustracaoDaEstacao('INVERNO')).toBe('/arte/estacao-inverno.webp');
  });
});
