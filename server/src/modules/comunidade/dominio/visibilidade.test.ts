import { mostraCuidados, podeVer, podeVerPerfil } from './visibilidade';

const dono = { id: 'a', perfilPublico: true, historicoPublico: true };

describe('podeVer', () => {
  it('outra pessoa vê só com perfil e planta públicos', () => {
    expect(podeVer(dono, true, 'b')).toBe(true);
    expect(podeVer(dono, false, 'b')).toBe(false);
    expect(podeVer({ ...dono, perfilPublico: false }, true, 'b')).toBe(false);
  });
  it('o dono sempre vê', () => {
    expect(podeVer({ ...dono, perfilPublico: false }, false, 'a')).toBe(true);
  });
});

describe('podeVerPerfil', () => {
  it('público para todos, privado só para o dono', () => {
    expect(podeVerPerfil(dono, 'b')).toBe(true);
    expect(podeVerPerfil({ ...dono, perfilPublico: false }, 'b')).toBe(false);
    expect(podeVerPerfil({ ...dono, perfilPublico: false }, 'a')).toBe(true);
  });
});

describe('mostraCuidados', () => {
  it('só com histórico público, salvo para o dono', () => {
    expect(mostraCuidados(dono, 'b')).toBe(true);
    expect(mostraCuidados({ ...dono, historicoPublico: false }, 'b')).toBe(false);
    expect(mostraCuidados({ ...dono, historicoPublico: false }, 'a')).toBe(true);
  });
});
