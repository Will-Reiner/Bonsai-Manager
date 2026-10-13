import { describe, expect, it } from 'vitest';
import { agruparFeed, capaDoPost, modoPlantas } from './comunidade';
import type { PostComunidade } from '@/types';

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
  it('lista ainda não carregada (ou com erro) → sem modo, para não salvar "Todas" sobre nada', () => {
    expect(modoPlantas(undefined)).toBeNull();
  });
});


const post = (id: string, autor: string, publicadoEm: string, over: Partial<PostComunidade> = {}): PostComunidade => ({
  id,
  dia: publicadoEm.slice(0, 10),
  publicadoEm,
  autor: { id: autor, nome: autor, fotoPerfilUrl: null },
  planta: { id: `p-${id}`, identificador: 1, nome: null, fotoCapaUrl: null, especie: null },
  fotos: [{ id: `f-${id}`, url: `u-${id}`, tipo: 'FOTO', thumbnailUrl: null }],
  cuidados: null,
  ...over,
});

describe('agruparFeed', () => {
  it('3+ seguidos da mesma pessoa no mesmo dia viram um grupo', () => {
    const posts = [post('1', 'a', '2026-10-13T15:00:00'), post('2', 'a', '2026-10-13T14:00:00'), post('3', 'a', '2026-10-13T13:00:00')];
    expect(agruparFeed(posts)).toEqual([{ tipo: 'grupo', chave: '1', autor: posts[0].autor, posts }]);
  });
  it('2 seguidos ficam soltos', () => {
    const posts = [post('1', 'a', '2026-10-13T15:00:00'), post('2', 'a', '2026-10-13T14:00:00')];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post']);
  });
  it('outra pessoa no meio quebra a sequência', () => {
    const posts = [
      post('1', 'a', '2026-10-13T15:00:00'),
      post('2', 'a', '2026-10-13T14:00:00'),
      post('3', 'b', '2026-10-13T13:30:00'),
      post('4', 'a', '2026-10-13T13:00:00'),
    ];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post', 'post', 'post']);
  });
  it('dias diferentes não se juntam', () => {
    const posts = [post('1', 'a', '2026-10-13T12:00:00'), post('2', 'a', '2026-10-13T11:00:00'), post('3', 'a', '2026-10-12T12:00:00')];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post', 'post']);
  });
});

describe('capaDoPost', () => {
  it('primeira foto; vídeo usa a miniatura', () => {
    expect(capaDoPost(post('1', 'a', '2026-10-13T12:00:00'))).toBe('u-1');
    const video = post('2', 'a', '2026-10-13T12:00:00', { fotos: [{ id: 'v', url: 'v.mp4', tipo: 'VIDEO', thumbnailUrl: 'v.webp' }] });
    expect(capaDoPost(video)).toBe('v.webp');
  });
});
