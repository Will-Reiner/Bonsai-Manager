import { codificarCursor, filtroDoFeed, filtroDosPostsDoUsuario, lerCursor } from './filtros';

const visivel = { OR: [{ usuarioId: 'eu' }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] };

describe('filtroDoFeed', () => {
  it('explorar: posts do feed visíveis (meus ou de perfil e planta públicos)', () => {
    expect(filtroDoFeed('eu', 'explorar')).toEqual({ noFeed: false, AND: [visivel] });
  });
  it('seguindo: além disso, só meus ou de quem eu sigo', () => {
    expect(filtroDoFeed('eu', 'seguindo')).toEqual({
      noFeed: false,
      AND: [visivel, { OR: [{ usuarioId: 'eu' }, { usuario: { seguidores: { some: { seguidorId: 'eu' } } } }] }],
    });
  });
});


describe('cursor da página (posição do último item, não o item em si)', () => {
  const data = new Date('2026-10-13T18:00:00.000Z');
  const id = '6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c';

  it('ida e volta', () => {
    expect(lerCursor(codificarCursor(data, id))).toEqual({ data, id });
  });
  it('texto inválido é recusado', () => {
    expect(() => lerCursor('lixo')).toThrow('Página inválida.');
    expect(() => lerCursor(`nao-e-data_${id}`)).toThrow('Página inválida.');
  });
  it('feed com cursor: só o que vem depois na ordem (publicadoEm desc, id desc), mesmo se o item do cursor sumiu', () => {
    expect(filtroDoFeed('eu', 'explorar', codificarCursor(data, id))).toEqual({
      noFeed: false,
      AND: [visivel, { OR: [{ publicadoEm: { lt: data } }, { publicadoEm: data, id: { lt: id } }] }],
    });
  });
  it('posts do perfil: plantas públicas do usuário, depois do cursor por dia', () => {
    expect(filtroDosPostsDoUsuario('u1')).toEqual({ usuarioId: 'u1', planta: { plantaPublica: true } });
    expect(filtroDosPostsDoUsuario('u1', codificarCursor(data, id))).toEqual({
      usuarioId: 'u1',
      planta: { plantaPublica: true },
      AND: [{ OR: [{ dia: { lt: data } }, { dia: data, id: { lt: id } }] }],
    });
  });
});
