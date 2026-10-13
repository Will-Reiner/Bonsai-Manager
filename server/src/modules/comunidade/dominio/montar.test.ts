import { chaveDoDia, ConteudoDoDia } from './conteudo';
import { linhaDoTempoPublica, montarPosts } from './montar';
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
