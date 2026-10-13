import { deveNotificar, interacoesPorPost, podeApagarComentario } from './interacoes';

describe('deveNotificar', () => {
  it('nunca por ação sobre si mesmo', () => {
    expect(deveNotificar('a', 'b')).toBe(true);
    expect(deveNotificar('a', 'a')).toBe(false);
  });
});

describe('podeApagarComentario', () => {
  it('autor e dono do post podem; outros não', () => {
    expect(podeApagarComentario('autor', 'dono', 'autor')).toBe(true);
    expect(podeApagarComentario('autor', 'dono', 'dono')).toBe(true);
    expect(podeApagarComentario('autor', 'dono', 'outro')).toBe(false);
  });
});

describe('interacoesPorPost', () => {
  it('contagens, curtiu e salvou por post; post sem nada fica zerado', () => {
    const mapa = interacoesPorPost(['p1', 'p2'], {
      curtidas: [{ postId: 'p1', total: 3 }],
      comentarios: [{ postId: 'p1', total: 2 }],
      curtiu: ['p1'],
      salvou: ['p2'],
    });
    expect(mapa.get('p1')).toEqual({ curtidas: 3, comentarios: 2, curtiu: true, salvou: false });
    expect(mapa.get('p2')).toEqual({ curtidas: 0, comentarios: 0, curtiu: false, salvou: true });
  });
});
