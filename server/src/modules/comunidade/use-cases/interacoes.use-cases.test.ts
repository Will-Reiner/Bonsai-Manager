import { ApagarComentarioUseCase } from './apagar-comentario.use-case';
import { ComentarUseCase } from './comentar.use-case';
import { ContarNaoLidasUseCase } from './contar-nao-lidas.use-case';
import { CurtirPostUseCase } from './curtir-post.use-case';
import { ListarComentariosUseCase } from './listar-comentarios.use-case';
import { ListarNotificacoesUseCase } from './listar-notificacoes.use-case';
import { ListarSalvosUseCase } from './listar-salvos.use-case';
import { MarcarLidasUseCase } from './marcar-lidas.use-case';
import { SalvarPostUseCase } from './salvar-post.use-case';
import { codificarCursor } from '../repositories/filtros';
import { InteracoesRepository, LeituraComunidadeRepository, PostLido } from '../comunidade.types';

const dono = { id: 'dono', nome: 'Dona', nomePublico: null, fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const leitor = { ...dono, id: 'b', nome: 'Bia' };
const planta = { id: 'p1', identificador: 1, nome: null, fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario: dono,
  planta,
  ...over,
});
const comentarioLido = { id: 'c1', texto: 'Lindo!', createdAt: new Date('2026-10-13T12:00:00Z'), usuario: leitor, post: { usuarioId: 'dono' } };

let leitura: jest.Mocked<LeituraComunidadeRepository>;
let repo: jest.Mocked<InteracoesRepository>;
beforeEach(() => {
  leitura = {
    feed: jest.fn(),
    post: jest.fn().mockResolvedValue(post()),
    postsDoUsuario: jest.fn(),
    conteudo: jest.fn().mockResolvedValue({
      fotos: [{ id: 'f1', plantaId: 'p1', caminhoArquivo: 'u', thumbnailUrl: null, tipo: 'FOTO', dataCaptura: null, createdAt: new Date('2026-10-10T15:00:00Z'), agenda: null }],
      cuidados: [],
    }),
    perfil: jest.fn(),
    plantasPublicas: jest.fn(),
    planta: jest.fn(),
    buscar: jest.fn(),
    interacoes: jest.fn().mockResolvedValue(new Map()),
    comentarios: jest.fn().mockResolvedValue([]),
    salvos: jest.fn().mockResolvedValue([]),
    notificacoes: jest.fn().mockResolvedValue([]),
    naoLidas: jest.fn().mockResolvedValue(0),
  };
  repo = {
    curtir: jest.fn().mockResolvedValue(true),
    descurtir: jest.fn().mockResolvedValue(true),
    totalCurtidas: jest.fn().mockResolvedValue(1),
    salvar: jest.fn().mockResolvedValue(undefined),
    dessalvar: jest.fn().mockResolvedValue(undefined),
    comentar: jest.fn().mockResolvedValue(comentarioLido),
    comentario: jest.fn().mockResolvedValue({ id: 'c1', usuarioId: 'b', post: { usuarioId: 'dono' } }),
    apagarComentario: jest.fn().mockResolvedValue(undefined),
    notificar: jest.fn().mockResolvedValue(undefined),
    removerNotificacoes: jest.fn().mockResolvedValue(undefined),
    marcarLidas: jest.fn().mockResolvedValue(undefined),
  };
});

describe('CurtirPostUseCase', () => {
  const aviso = { usuarioId: 'dono', atorId: 'b', tipo: 'CURTIDA', postId: 'post1' };

  it('curtida e aviso ao dono vão juntos para o repositório (mesma transação) e volta a contagem do servidor', async () => {
    const r = await new CurtirPostUseCase(leitura, repo).execute('b', 'post1', true);
    expect(repo.curtir).toHaveBeenCalledWith('b', 'post1', aviso);
    expect(repo.notificar).not.toHaveBeenCalled();
    expect(r).toEqual({ curtiu: true, curtidas: 1 });
  });
  it('curtir o próprio post: sem aviso', async () => {
    await new CurtirPostUseCase(leitura, repo).execute('dono', 'post1', true);
    expect(repo.curtir).toHaveBeenCalledWith('dono', 'post1', null);
  });
  it('descurtir leva junto a remoção do aviso', async () => {
    repo.totalCurtidas.mockResolvedValue(0);
    const r = await new CurtirPostUseCase(leitura, repo).execute('b', 'post1', false);
    expect(repo.descurtir).toHaveBeenCalledWith('b', 'post1', aviso);
    expect(repo.removerNotificacoes).not.toHaveBeenCalled();
    expect(r).toEqual({ curtiu: false, curtidas: 0 });
  });
  it('post invisível: 404 sem gravar', async () => {
    leitura.post.mockResolvedValue(post({ usuario: { ...dono, perfilPublico: false } }));
    await expect(new CurtirPostUseCase(leitura, repo).execute('b', 'post1', true)).rejects.toThrow('Post não encontrado.');
    expect(repo.curtir).not.toHaveBeenCalled();
  });
});

describe('SalvarPostUseCase', () => {
  it('salva e tira dos salvos', async () => {
    expect(await new SalvarPostUseCase(leitura, repo).execute('b', 'post1', true)).toEqual({ salvou: true });
    expect(repo.salvar).toHaveBeenCalledWith('b', 'post1');
    expect(await new SalvarPostUseCase(leitura, repo).execute('b', 'post1', false)).toEqual({ salvou: false });
    expect(repo.dessalvar).toHaveBeenCalledWith('b', 'post1');
  });
  it('não salva post invisível', async () => {
    leitura.post.mockResolvedValue(null);
    await expect(new SalvarPostUseCase(leitura, repo).execute('b', 'x', true)).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ComentarUseCase', () => {
  it('comentário e aviso ao dono vão juntos para o repositório (mesma transação)', async () => {
    const c = await new ComentarUseCase(leitura, repo).execute('b', 'post1', 'Lindo!');
    expect(repo.comentar).toHaveBeenCalledWith('b', 'post1', 'Lindo!', { usuarioId: 'dono', atorId: 'b', tipo: 'COMENTARIO', postId: 'post1' });
    expect(repo.notificar).not.toHaveBeenCalled();
    expect(c).toMatchObject({ id: 'c1', texto: 'Lindo!', podeApagar: true });
  });
  it('comentar no próprio post: sem aviso', async () => {
    repo.comentar.mockResolvedValue({ ...comentarioLido, usuario: dono });
    await new ComentarUseCase(leitura, repo).execute('dono', 'post1', 'Obrigada');
    expect(repo.comentar).toHaveBeenCalledWith('dono', 'post1', 'Obrigada', null);
  });
  it('post invisível: 404', async () => {
    leitura.post.mockResolvedValue(post({ planta: { ...planta, plantaPublica: false } }));
    await expect(new ComentarUseCase(leitura, repo).execute('b', 'post1', 'oi')).rejects.toThrow('Post não encontrado.');
    expect(repo.comentar).not.toHaveBeenCalled();
  });
});

describe('ApagarComentarioUseCase', () => {
  it('autor apaga o seu; dono do post apaga qualquer um', async () => {
    await new ApagarComentarioUseCase(repo).execute('b', 'c1');
    await new ApagarComentarioUseCase(repo).execute('dono', 'c1');
    expect(repo.apagarComentario).toHaveBeenCalledTimes(2);
  });
  it('outra pessoa: 404 sem apagar', async () => {
    await expect(new ApagarComentarioUseCase(repo).execute('outro', 'c1')).rejects.toThrow('Comentário não encontrado.');
    expect(repo.apagarComentario).not.toHaveBeenCalled();
  });
  it('comentário que não existe: 404', async () => {
    repo.comentario.mockResolvedValue(null);
    await expect(new ApagarComentarioUseCase(repo).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ListarComentariosUseCase', () => {
  it('lista do post visível com permissão por comentário', async () => {
    leitura.comentarios.mockResolvedValue([comentarioLido]);
    const r = await new ListarComentariosUseCase(leitura).execute('outro', 'post1');
    expect(leitura.comentarios).toHaveBeenCalledWith('post1', undefined, 30);
    expect(r.itens[0]).toMatchObject({ id: 'c1', podeApagar: false });
    expect(r.proximoCursor).toBeNull();
  });
  it('página cheia devolve cursor pela posição do último', async () => {
    leitura.comentarios.mockResolvedValue(Array.from({ length: 30 }, (_, i) => ({ ...comentarioLido, id: `c${i}` })));
    const r = await new ListarComentariosUseCase(leitura).execute('b', 'post1');
    expect(r.proximoCursor).toBe(codificarCursor(comentarioLido.createdAt, 'c29'));
  });
  it('post invisível: 404', async () => {
    leitura.post.mockResolvedValue(null);
    await expect(new ListarComentariosUseCase(leitura).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ListarSalvosUseCase', () => {
  it('monta os posts salvos e pagina pela data do salvo', async () => {
    const salvoEm = new Date('2026-10-13T20:00:00Z');
    leitura.salvos.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ createdAt: salvoEm, post: post({ id: `post${i}` }) })));
    const r = await new ListarSalvosUseCase(leitura).execute('b');
    expect(leitura.salvos).toHaveBeenCalledWith('b', undefined, 20);
    expect(r.itens).toHaveLength(20);
    expect(r.proximoCursor).toBe(codificarCursor(salvoEm, 'post19'));
  });
});

describe('notificações', () => {
  it('lista montada, conta não lidas e marca como lidas', async () => {
    const n = { id: 'n1', tipo: 'SEGUIU' as const, lida: false, createdAt: new Date('2026-10-13T12:00:00Z'), ator: leitor, post: null, comentario: null };
    leitura.notificacoes.mockResolvedValue([n]);
    leitura.naoLidas.mockResolvedValue(3);
    const r = await new ListarNotificacoesUseCase(leitura).execute('dono');
    expect(leitura.notificacoes).toHaveBeenCalledWith('dono', undefined, 20);
    expect(r.itens[0]).toMatchObject({ id: 'n1', tipo: 'SEGUIU', ator: { id: 'b', nome: 'Bia' } });
    expect(await new ContarNaoLidasUseCase(leitura).execute('dono')).toEqual({ total: 3 });
    await new MarcarLidasUseCase(repo).execute('dono');
    expect(repo.marcarLidas).toHaveBeenCalledWith('dono');
  });
});
