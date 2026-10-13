import { describe, expect, it } from 'vitest';
import { modoPlantas } from './comunidade';

describe('modoPlantas', () => {
  it('todas públicas → todas', () => {
    expect(modoPlantas([{ plantaPublica: true }, { plantaPublica: true }])).toBe('todas');
  });
  it('alguma privada → selecionadas', () => {
    expect(modoPlantas([{ plantaPublica: true }, { plantaPublica: false }])).toBe('selecionadas');
  });
  it('nenhuma pública → selecionadas', () => {
    expect(modoPlantas([{ plantaPublica: false }])).toBe('selecionadas');
  });
  it('sem plantas → todas (as próximas já nascem públicas)', () => {
    expect(modoPlantas([])).toBe('todas');
  });
});
