import { BuscarPerfisUseCase } from './buscar-perfis.use-case';
import { ListarPostsDoPerfilUseCase } from './listar-posts-do-perfil.use-case';
import { ObterFeedUseCase } from './obter-feed.use-case';
import { ObterPerfilUseCase } from './obter-perfil.use-case';
import { ObterPlantaPublicaUseCase } from './obter-planta-publica.use-case';
import { ObterPostUseCase } from './obter-post.use-case';
import { codificarCursor } from '../repositories/filtros';
import { LeituraComunidadeRepository, PerfilLido, PostLido } from '../comunidade.types';

const usuario = { id: 'a', nome: 'Ana', nomePublico: null, fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const planta = { id: 'p1', identificador: 1, nome: 'Ficus', fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario,
  planta,
  ...over,
});
const conteudo = {
  fotos: [{ id: 'f1', plantaId: 'p1', caminhoArquivo: 'u', thumbnailUrl: null, tipo: 'FOTO', dataCaptura: null, createdAt: new Date('2026-10-10T15:00:00Z'), agenda: null }],
  cuidados: [{ plantaId: 'p1', dataConcluida: new Date('2026-10-10T15:00:00Z'), dataAgendada: new Date('2026-10-10T15:00:00Z'), detalhes: 'nota', observacaoFutura: null, atividade: { nome: 'Poda' } }],
};
const perfil = (over: Partial<PerfilLido> = {}): PerfilLido => ({
  ...usuario,
  bio: null,
  localidade: null,
  plantas: 2,
  seguidores: 5,
  seguindo: 1,
  sigo: false,
  ...over,
});

let repo: jest.Mocked<LeituraComunidadeRepository>;
beforeEach(() => {
  repo = {
    feed: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue(null),
    postsDoUsuario: jest.fn().mockResolvedValue([]),
    conteudo: jest.fn().mockResolvedValue(conteudo),
    perfil: jest.fn().mockResolvedValue(null),
    plantasPublicas: jest.fn().mockResolvedValue([]),
    planta: jest.fn().mockResolvedValue(null),
    buscar: jest.fn().mockResolvedValue([]),
  };
});

describe('ObterFeedUseCase', () => {
  it('monta os posts com o conteúdo das plantas da página', async () => {
    repo.feed.mockResolvedValue([post()]);
    const r = await new ObterFeedUseCase(repo).execute('b', 'explorar');
    expect(repo.feed).toHaveBeenCalledWith('b', 'explorar', undefined, 20);
    // Só os dias da página (não o histórico inteiro das plantas)
    expect(repo.conteudo).toHaveBeenCalledWith(['p1'], { de: new Date('2026-10-09T00:00:00Z'), ate: new Date('2026-10-12T00:00:00Z') });
    expect(r.itens).toHaveLength(1);
    expect(r.proximoCursor).toBeNull();
  });
  it('página cheia devolve o cursor do último lido', async () => {
    repo.feed.mockResolvedValue(Array.from({ length: 20 }, (_, i) => post({ id: `post${i}` })));
    const r = await new ObterFeedUseCase(repo).execute('b', 'seguindo', 'x');
    expect(repo.feed).toHaveBeenCalledWith('b', 'seguindo', 'x', 20);
    expect(r.proximoCursor).toBe(codificarCursor(new Date('2026-10-10T18:00:00Z'), 'post19'));
  });
  it('página vazia não consulta conteúdo', async () => {
    const r = await new ObterFeedUseCase(repo).execute('b', 'explorar');
    expect(repo.conteudo).not.toHaveBeenCalled();
    expect(r).toEqual({ itens: [], proximoCursor: null });
  });
});

describe('ObterPostUseCase', () => {
  it('post visível volta montado', async () => {
    repo.post.mockResolvedValue(post());
    const dto = await new ObterPostUseCase(repo).execute('b', 'post1');
    expect(dto.id).toBe('post1');
    expect(dto.cuidados).toEqual([{ atividade: 'Poda', detalhes: 'nota', observacao: null }]);
  });
  it('perfil que ficou privado: 404 para os outros, visível para o dono', async () => {
    repo.post.mockResolvedValue(post({ usuario: { ...usuario, perfilPublico: false } }));
    await expect(new ObterPostUseCase(repo).execute('b', 'post1')).rejects.toThrow('Post não encontrado.');
    await expect(new ObterPostUseCase(repo).execute('a', 'post1')).resolves.toMatchObject({ id: 'post1' });
  });
  it('planta privada ou post inexistente: 404', async () => {
    repo.post.mockResolvedValue(post({ planta: { ...planta, plantaPublica: false } }));
    await expect(new ObterPostUseCase(repo).execute('b', 'post1')).rejects.toMatchObject({ name: 'NaoEncontrado' });
    repo.post.mockResolvedValue(null);
    await expect(new ObterPostUseCase(repo).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
  it('histórico privado: sem cuidados para os outros', async () => {
    repo.post.mockResolvedValue(post({ usuario: { ...usuario, historicoPublico: false } }));
    expect((await new ObterPostUseCase(repo).execute('b', 'post1')).cuidados).toBeNull();
  });
});

describe('ObterPerfilUseCase', () => {
  it('perfil público com contagem, plantas e "eu"/"sigo"', async () => {
    repo.perfil.mockResolvedValue(perfil({ sigo: true }));
    repo.plantasPublicas.mockResolvedValue([planta]);
    const p = await new ObterPerfilUseCase(repo).execute('b', 'a');
    expect(repo.perfil).toHaveBeenCalledWith('a', 'b');
    expect(p).toEqual({
      id: 'a',
      nome: 'Ana',
      fotoPerfilUrl: null,
      bio: null,
      localidade: null,
      eu: false,
      sigo: true,
      contagem: { plantas: 2, seguidores: 5, seguindo: 1 },
      plantas: [{ id: 'p1', identificador: 1, nome: 'Ficus', fotoCapaUrl: null, especie: null }],
    });
  });
  it('privado: 404 para os outros, visível para o dono', async () => {
    repo.perfil.mockResolvedValue(perfil({ perfilPublico: false }));
    await expect(new ObterPerfilUseCase(repo).execute('b', 'a')).rejects.toThrow('Perfil não encontrado.');
    await expect(new ObterPerfilUseCase(repo).execute('a', 'a')).resolves.toMatchObject({ eu: true });
  });
});

describe('ListarPostsDoPerfilUseCase', () => {
  it('lista os posts do perfil visível', async () => {
    repo.perfil.mockResolvedValue(perfil());
    repo.postsDoUsuario.mockResolvedValue([post()]);
    const r = await new ListarPostsDoPerfilUseCase(repo).execute('b', 'a');
    expect(repo.postsDoUsuario).toHaveBeenCalledWith('a', undefined, 20);
    expect(r.itens).toHaveLength(1);
  });
  it('página cheia do perfil: cursor pelo dia do último', async () => {
    repo.perfil.mockResolvedValue(perfil());
    repo.postsDoUsuario.mockResolvedValue(Array.from({ length: 20 }, (_, i) => post({ id: `post${i}` })));
    const r = await new ListarPostsDoPerfilUseCase(repo).execute('b', 'a');
    expect(r.proximoCursor).toBe(codificarCursor(new Date('2026-10-10T00:00:00Z'), 'post19'));
  });
  it('perfil privado: 404 sem listar', async () => {
    repo.perfil.mockResolvedValue(perfil({ perfilPublico: false }));
    await expect(new ListarPostsDoPerfilUseCase(repo).execute('b', 'a')).rejects.toMatchObject({ name: 'NaoEncontrado' });
    expect(repo.postsDoUsuario).not.toHaveBeenCalled();
  });
});

describe('ObterPlantaPublicaUseCase', () => {
  const plantaLida = { ...planta, usuario, posts: [{ id: 'post1', dia: new Date('2026-10-10T00:00:00Z') }] };

  it('planta pública com dono e linha do tempo', async () => {
    repo.planta.mockResolvedValue(plantaLida);
    const r = await new ObterPlantaPublicaUseCase(repo).execute('b', 'p1');
    expect(repo.conteudo).toHaveBeenCalledWith(['p1']);
    expect(r.dono).toEqual({ id: 'a', nome: 'Ana', fotoPerfilUrl: null });
    expect(r.dias).toEqual([
      { dia: '2026-10-10', postId: 'post1', fotos: [{ id: 'f1', url: 'u', tipo: 'FOTO', thumbnailUrl: null }], cuidados: [{ atividade: 'Poda', detalhes: 'nota', observacao: null }] },
    ]);
  });
  it('histórico privado: dias sem cuidados', async () => {
    repo.planta.mockResolvedValue({ ...plantaLida, usuario: { ...usuario, historicoPublico: false } });
    const r = await new ObterPlantaPublicaUseCase(repo).execute('b', 'p1');
    expect(r.dias[0].cuidados).toBeNull();
  });
  it('planta privada: 404', async () => {
    repo.planta.mockResolvedValue({ ...plantaLida, plantaPublica: false });
    await expect(new ObterPlantaPublicaUseCase(repo).execute('b', 'p1')).rejects.toThrow('Planta não encontrada.');
  });
});

describe('BuscarPerfisUseCase', () => {
  it('menos de 2 letras não busca', async () => {
    expect(await new BuscarPerfisUseCase(repo).execute(' a ')).toEqual([]);
    expect(repo.buscar).not.toHaveBeenCalled();
  });
  it('busca o termo limpo e devolve autores', async () => {
    repo.buscar.mockResolvedValue([{ ...usuario, nomePublico: 'Aninha' }]);
    expect(await new BuscarPerfisUseCase(repo).execute('  an ')).toEqual([{ id: 'a', nome: 'Aninha', fotoPerfilUrl: null }]);
    expect(repo.buscar).toHaveBeenCalledWith('an', 20);
  });
});
