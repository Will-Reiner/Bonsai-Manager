import { describe, expect, it } from 'vitest';
import { lerFavoritas } from './favoritas';

describe('lerFavoritas', () => {
  it('lista de ids salva como JSON', () => {
    expect(lerFavoritas('["a1","a2"]')).toEqual(['a1', 'a2']);
  });

  it('sem preferência: nenhuma', () => {
    expect(lerFavoritas(undefined)).toEqual([]);
    expect(lerFavoritas('')).toEqual([]);
  });

  it('valor quebrado ou que não é lista de textos: nenhuma', () => {
    expect(lerFavoritas('{oops')).toEqual([]);
    expect(lerFavoritas('{"a":1}')).toEqual([]);
    expect(lerFavoritas('["a1",2,null]')).toEqual(['a1']);
  });
});
