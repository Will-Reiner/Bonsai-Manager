import { chaveDoDia, ConteudoDoDia } from './conteudo';
import { comentarioDe, linhaDoTempoPublica, montarPosts, notificacaoDe } from './montar';
import type { PostLido } from '../comunidade.types';

const usuario = { id: 'a', nome: 'Ana Souza', nomePublico: 'Ana', fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const planta = { id: 'p1', identificador: 3, nome: 'Ficus', fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario,
  planta,
  ...over,
});
const doDia: ConteudoDoDia = {
  fotos: [{ id: 'f1', url: 'u', tipo: 'FOTO', thumbnailUrl: null }],
  cuidados: [{ atividade: 'Poda', detalhes: 'x', observacao: null }],
};
const mapa = (entradas: [string, ConteudoDoDia][]) => new Map(entradas);

describe('montarPosts', () => {
  it('monta o DTO com nome público, planta sem a flag e dia em texto', () => {
    const [dto] = montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b');
    expect(dto).toEqual({
      id: 'post1',
      dia: '2026-10-10',
      publicadoEm: new Date('2026-10-10T18:00:00Z'),
      autor: { id: 'a', nome: 'Ana', fotoPerfilUrl: null },
      planta: { id: 'p1', identificador: 3, nome: 'Ficus', fotoCapaUrl: null, especie: null },
      fotos: doDia.fotos,
      cuidados: doDia.cuidados,
      curtidas: 0,
      curtiu: false,
      salvou: false,
      totalComentarios: 0,
    });
  });
  it('sem nome público usa o nome', () => {
    const [dto] = montarPosts([post({ usuario: { ...usuario, nomePublico: null } })], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b');
    expect(dto.autor.nome).toBe('Ana Souza');
  });
  it('histórico privado: cuidados null para os outros, visíveis para o dono', () => {
    const privado = post({ usuario: { ...usuario, historicoPublico: false } });
    const conteudo = mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]);
    expect(montarPosts([privado], conteudo, 'b')[0].cuidados).toBeNull();
    expect(montarPosts([privado], conteudo, 'a')[0].cuidados).toEqual(doDia.cuidados);
  });
  it('dia que ficou sem fotos não vira card vazio', () => {
    expect(montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), { fotos: [], cuidados: doDia.cuidados }]]), 'b')).toEqual([]);
    expect(montarPosts([post()], mapa([]), 'b')).toEqual([]);
  });
});

describe('linhaDoTempoPublica', () => {
  const soCuidado: ConteudoDoDia = { fotos: [], cuidados: [{ atividade: 'Rega', detalhes: null, observacao: null }] };
  const conteudo = mapa([
    [chaveDoDia('p1', '2026-10-10'), doDia],
    [chaveDoDia('p1', '2026-10-12'), soCuidado],
    [chaveDoDia('p2', '2026-10-11'), doDia],
  ]);
  const posts = [{ id: 'post1', dia: new Date('2026-10-10T00:00:00Z') }];

  it('com cuidados: dias com foto (com post) e dias só de cuidado, mais novo primeiro, só da planta', () => {
    expect(linhaDoTempoPublica('p1', posts, conteudo, true)).toEqual([
      { dia: '2026-10-12', postId: null, fotos: [], cuidados: soCuidado.cuidados },
      { dia: '2026-10-10', postId: 'post1', fotos: doDia.fotos, cuidados: doDia.cuidados },
    ]);
  });
  it('sem cuidados: só dias com foto, cuidados null', () => {
    expect(linhaDoTempoPublica('p1', posts, conteudo, false)).toEqual([
      { dia: '2026-10-10', postId: 'post1', fotos: doDia.fotos, cuidados: null },
    ]);
  });
});


describe('montarPosts com interações', () => {
  it('usa as contagens do post', () => {
    const inter = new Map([['post1', { curtidas: 4, comentarios: 1, curtiu: true, salvou: true }]]);
    const [dto] = montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b', inter);
    expect(dto).toMatchObject({ curtidas: 4, curtiu: true, salvou: true, totalComentarios: 1 });
  });
});

describe('comentarioDe', () => {
  const c = { id: 'c1', texto: 'Lindo!', createdAt: new Date('2026-10-13T12:00:00Z'), usuario, post: { usuarioId: 'dono' } };
  it('autor com nome público e permissão de apagar', () => {
    expect(comentarioDe(c, 'a')).toEqual({ id: 'c1', texto: 'Lindo!', createdAt: c.createdAt, autor: { id: 'a', nome: 'Ana', fotoPerfilUrl: null }, podeApagar: true });
    expect(comentarioDe(c, 'dono').podeApagar).toBe(true);
    expect(comentarioDe(c, 'outro').podeApagar).toBe(false);
  });
});

describe('notificacaoDe', () => {
  it('ator, post com a capa da planta e trecho do comentário', () => {
    const n = {
      id: 'n1', tipo: 'COMENTARIO' as const, lida: false, createdAt: new Date('2026-10-13T12:00:00Z'), ator: usuario,
      post: { id: 'post1', planta: { id: 'p1', fotoCapaUrl: 'capa.webp' } }, comentario: { texto: 'Lindo!' },
    };
    expect(notificacaoDe(n)).toEqual({
      id: 'n1', tipo: 'COMENTARIO', lida: false, createdAt: n.createdAt, ator: { id: 'a', nome: 'Ana', fotoPerfilUrl: null },
      post: { id: 'post1', plantaId: 'p1', capa: 'capa.webp' }, comentario: 'Lindo!',
    });
  });
  it('seguir: sem post e sem comentário', () => {
    const n = { id: 'n2', tipo: 'SEGUIU' as const, lida: true, createdAt: new Date(), ator: usuario, post: null, comentario: null };
    expect(notificacaoDe(n)).toMatchObject({ post: null, comentario: null });
  });
});
