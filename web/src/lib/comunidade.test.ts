import { describe, expect, it } from 'vitest';
import {
  agruparFeed,
  alternarCurtida,
  capaDoPost,
  chaveDoPost,
  linkDaNotificacao,
  modoPlantas,
  rotuloComentarios,
  rotuloCurtidas,
  textoDaNotificacao,
} from './comunidade';
import type { NotificacaoComunidade, PostComunidade } from '@/types';

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
  curtidas: 0,
  curtiu: false,
  salvou: false,
  totalComentarios: 0,
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

describe('alternarCurtida', () => {
  it('curtir soma, descurtir subtrai, repetir não muda', () => {
    expect(alternarCurtida({ curtiu: false, curtidas: 2 }, true)).toEqual({ curtiu: true, curtidas: 3 });
    expect(alternarCurtida({ curtiu: true, curtidas: 3 }, false)).toEqual({ curtiu: false, curtidas: 2 });
    expect(alternarCurtida({ curtiu: true, curtidas: 3 }, true)).toEqual({ curtiu: true, curtidas: 3 });
  });
  it('nunca fica negativo', () => {
    expect(alternarCurtida({ curtiu: true, curtidas: 0 }, false)).toEqual({ curtiu: false, curtidas: 0 });
  });
});

describe('rótulos', () => {
  it('singular e plural', () => {
    expect(rotuloCurtidas(1)).toBe('1 curtida');
    expect(rotuloCurtidas(4)).toBe('4 curtidas');
    expect(rotuloComentarios(1)).toBe('ver 1 comentário');
    expect(rotuloComentarios(3)).toBe('ver os 3 comentários');
  });
});

describe('notificação', () => {
  const base: NotificacaoComunidade = {
    id: 'n', tipo: 'CURTIDA', lida: false, createdAt: '2026-10-13T12:00:00Z',
    ator: { id: 'a', nome: 'Ana', fotoPerfilUrl: null }, post: { id: 'post1', plantaId: 'p1', capa: null }, comentario: null,
  };
  it('texto por tipo, com trecho do comentário', () => {
    expect(textoDaNotificacao(base)).toBe('curtiu seu post');
    expect(textoDaNotificacao({ ...base, tipo: 'SEGUIU', post: null })).toBe('começou a seguir você');
    expect(textoDaNotificacao({ ...base, tipo: 'COMENTARIO', comentario: 'Lindo!' })).toBe('comentou: “Lindo!”');
    const longo = 'a'.repeat(100);
    expect(textoDaNotificacao({ ...base, tipo: 'COMENTARIO', comentario: longo })).toBe(`comentou: “${'a'.repeat(59)}…”`);
  });
  it('link: post (comentário vai à seção) ou perfil', () => {
    expect(linkDaNotificacao(base)).toBe('/comunidade/post/post1');
    expect(linkDaNotificacao({ ...base, tipo: 'COMENTARIO' })).toBe('/comunidade/post/post1#comentarios');
    expect(linkDaNotificacao({ ...base, tipo: 'SEGUIU', post: null })).toBe('/comunidade/u/a');
  });
});

describe('chaveDoPost', () => {
  it('muda quando as interações vindas do servidor mudam (o cartão recomeça do valor novo)', () => {
    const p = post('1', 'a', '2026-10-13T12:00:00');
    expect(chaveDoPost(p)).not.toBe(chaveDoPost({ ...p, curtidas: 1 }));
    expect(chaveDoPost(p)).toBe(chaveDoPost({ ...p }));
  });
});
