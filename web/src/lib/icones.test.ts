import { describe, expect, it } from 'vitest';
import { iconeDaAtividade, urlIcone } from './icones';

describe('iconeDaAtividade', () => {
  it.each([
    ['Rega', 'rega'],
    ['Adubação', 'adubacao'],
    ['Adubação líquida', 'adubacao-liquida'],
    ['Adubo líquido', 'adubacao-liquida'],
    ['Poda de manutenção', 'poda'],
    ['Poda estrutural', 'poda-estrutural'],
    ['Desfolha', 'desfolha'],
    ['Aramação', 'aramacao'],
    ['Desaramação', 'desaramacao'],
    ['Transplante', 'transplante'],
    ['Tratamento fitossanitário', 'fitossanitario'],
    ['Controle de pragas', 'fitossanitario'],
    ['Revisão', 'revisao'],
  ])('%s → %s', (nome, icone) => {
    expect(iconeDaAtividade(nome)).toBe(icone);
  });

  it('ignora maiúsculas, acentos e espaços nas pontas', () => {
    expect(iconeDaAtividade('  ADUBAÇÃO LÍQUIDA ')).toBe('adubacao-liquida');
  });

  it('atividade desconhecida ou vazia usa o genérico', () => {
    expect(iconeDaAtividade('Pinçamento')).toBe('generico');
    expect(iconeDaAtividade('')).toBe('generico');
  });
});

describe('urlIcone', () => {
  it('aponta para /icones/<nome>.svg', () => {
    expect(urlIcone('rega')).toBe('/icones/rega.svg');
  });

  it('navegação e ações da Comunidade têm desenho ativo; os demais ignoram o pedido', () => {
    expect(urlIcone('bancada', true)).toBe('/icones/bancada-ativo.svg');
    expect(urlIcone('perfil', true)).toBe('/icones/perfil-ativo.svg');
    expect(urlIcone('comunidade', true)).toBe('/icones/comunidade-ativo.svg');
    expect(urlIcone('curtir', true)).toBe('/icones/curtir-ativo.svg');
    expect(urlIcone('curtir')).toBe('/icones/curtir.svg');
    expect(urlIcone('rega', true)).toBe('/icones/rega.svg');
    expect(urlIcone('mais', true)).toBe('/icones/mais.svg');
  });
});
