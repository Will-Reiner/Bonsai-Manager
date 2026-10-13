import { codificarCursor, filtroDaBusca, filtroDasNotificacoes, filtroDoFeed, filtroDosComentarios, filtroDosSalvos, visivelPara, filtroDosPostsDoUsuario, filtrosDaJanela, janelaDosPosts, lerCursor } from './filtros';

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


describe('janela de leitura do conteúdo (só os dias da página)', () => {
  const de = new Date('2026-10-09T00:00:00.000Z');
  const ate = new Date('2026-10-14T00:00:00.000Z');

  it('do dia mais antigo − 1 ao mais novo + 2 (cobre o fuso de São Paulo)', () => {
    const posts = [{ dia: new Date('2026-10-12T00:00:00Z') }, { dia: new Date('2026-10-10T00:00:00Z') }];
    expect(janelaDosPosts(posts)).toEqual({ de, ate });
  });
  it('fotos pela captura, pelo upload (sem captura) ou pelo dia do cuidado; cuidados pela data feita', () => {
    const dentro = { gte: de, lt: ate };
    const peloCuidado = { OR: [{ dataConcluida: dentro }, { dataConcluida: null, dataAgendada: dentro }] };
    expect(filtrosDaJanela({ de, ate })).toEqual({
      fotos: { OR: [{ dataCaptura: dentro }, { dataCaptura: null, createdAt: dentro }, { agenda: { status: 'CONCLUIDO', ...peloCuidado } }] },
      cuidados: peloCuidado,
    });
  });
});

describe('filtroDaBusca', () => {
  it('só perfis públicos e só pelo nome público (o nome cadastrado não liga um pseudônimo ao nome real)', () => {
    expect(filtroDaBusca('an')).toEqual({ perfilPublico: true, nomePublico: { contains: 'an', mode: 'insensitive' } });
  });
});


describe('filtros das interações', () => {
  const data = new Date('2026-10-13T18:00:00.000Z');
  const id = '6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c';
  const cursor = codificarCursor(data, id);

  it('visivelPara é a mesma regra do feed', () => {
    expect(visivelPara('eu')).toEqual(visivel);
  });
  it('comentários em ordem crescente: depois do cursor = mais novos', () => {
    expect(filtroDosComentarios('post1')).toEqual({ postId: 'post1' });
    expect(filtroDosComentarios('post1', cursor)).toEqual({
      postId: 'post1',
      OR: [{ createdAt: { gt: data } }, { createdAt: data, id: { gt: id } }],
    });
  });
  it('salvos: só os meus de posts ainda visíveis, do mais recente salvo', () => {
    expect(filtroDosSalvos('eu')).toEqual({ usuarioId: 'eu', post: visivel });
    expect(filtroDosSalvos('eu', cursor)).toEqual({
      usuarioId: 'eu',
      post: visivel,
      OR: [{ createdAt: { lt: data } }, { createdAt: data, postId: { lt: id } }],
    });
  });
  it('notificações: só as minhas, das mais novas', () => {
    expect(filtroDasNotificacoes('eu')).toEqual({ usuarioId: 'eu' });
    expect(filtroDasNotificacoes('eu', cursor)).toEqual({
      usuarioId: 'eu',
      OR: [{ createdAt: { lt: data } }, { createdAt: data, id: { lt: id } }],
    });
  });
});
