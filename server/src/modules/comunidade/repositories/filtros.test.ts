import { filtroDoFeed } from './filtros';

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
