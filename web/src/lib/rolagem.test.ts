import { describe, expect, it } from 'vitest';
import { MANTER_ROLAGEM, deveReposicionarCarrossel, deveRolarParaTopo } from './rolagem';

describe('deveRolarParaTopo', () => {
  it('tela nova (PUSH/REPLACE) abre no topo', () => {
    expect(deveRolarParaTopo('PUSH', null)).toBe(true);
    expect(deveRolarParaTopo('REPLACE', undefined)).toBe(true);
  });

  it('voltar (POP) mantém a rolagem', () => {
    expect(deveRolarParaTopo('POP', null)).toBe(false);
  });

  it('troca pedindo para manter a rolagem (deslizar o carrossel) não rola', () => {
    expect(deveRolarParaTopo('REPLACE', MANTER_ROLAGEM)).toBe(false);
  });
});

describe('deveReposicionarCarrossel', () => {
  it('abre no painel da URL quando o visível é outro (deep link)', () => {
    expect(deveReposicionarCarrossel({ painelVisivel: 0, atual: 2, veioDaRolagem: false })).toBe(true);
  });

  it('não mexe quando já está no painel certo', () => {
    expect(deveReposicionarCarrossel({ painelVisivel: 2, atual: 2, veioDaRolagem: false })).toBe(false);
  });

  it('troca causada pelo próprio deslizar não puxa de volta, mesmo com o gesto já adiante', () => {
    expect(deveReposicionarCarrossel({ painelVisivel: 3, atual: 1, veioDaRolagem: true })).toBe(false);
  });
});
