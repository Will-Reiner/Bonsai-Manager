import { SincronizarPostsUseCase } from './sincronizar-posts.use-case';
import { EstadoPostsDaPlanta, PostsRepository } from '../comunidade.types';

describe('SincronizarPostsUseCase', () => {
  const agora = new Date('2026-10-13T15:00:00Z');
  let repo: jest.Mocked<PostsRepository>;
  let useCase: SincronizarPostsUseCase;

  const estado = (over: Partial<EstadoPostsDaPlanta> = {}): EstadoPostsDaPlanta => ({
    plantaId: 'p1',
    usuarioId: 'u1',
    perfilPublico: true,
    plantaPublica: true,
    postarAutomatico: true,
    fotos: [{ tipo: 'FOTO', dataCaptura: null, createdAt: agora, agenda: null }],
    diasComPost: [],
    ...over,
  });

  beforeEach(() => {
    repo = { estadoDasPlantas: jest.fn(), aplicar: jest.fn().mockResolvedValue(undefined) };
    useCase = new SincronizarPostsUseCase(repo, () => agora);
  });

  it('cria o post do dia novo', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado()]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.estadoDasPlantas).toHaveBeenCalledWith(['p1'], undefined);
    expect(repo.aplicar).toHaveBeenCalledWith('p1', 'u1', { criar: [{ dia: '2026-10-13', noFeed: false }], apagar: [] }, undefined);
  });

  it('nada muda → não escreve', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado({ diasComPost: ['2026-10-13'] })]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.aplicar).not.toHaveBeenCalled();
  });

  it('última foto do dia apagada → apaga o post', async () => {
    repo.estadoDasPlantas.mockResolvedValue([estado({ fotos: [], diasComPost: ['2026-10-13'] })]);
    await useCase.execute({ plantaIds: ['p1'] });
    expect(repo.aplicar).toHaveBeenCalledWith('p1', 'u1', { criar: [], apagar: ['2026-10-13'] }, undefined);
  });

  it('ignora ids vazios/repetidos e não consulta sem plantas', async () => {
    await useCase.execute({ plantaIds: ['', ''] });
    expect(repo.estadoDasPlantas).not.toHaveBeenCalled();
    repo.estadoDasPlantas.mockResolvedValue([]);
    await useCase.execute({ plantaIds: ['p1', 'p1', ''] });
    expect(repo.estadoDasPlantas).toHaveBeenCalledWith(['p1'], undefined);
  });

  it('fora de transação, falha só vai para o log (não derruba quem chamou)', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    repo.estadoDasPlantas.mockRejectedValue(new Error('banco caiu'));
    await expect(useCase.execute({ plantaIds: ['p1'] })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('dentro de transação, a falha sobe (desfaz junto)', async () => {
    const db = {} as never;
    repo.estadoDasPlantas.mockRejectedValue(new Error('banco caiu'));
    await expect(useCase.execute({ plantaIds: ['p1'] }, 'u1', db)).rejects.toThrow('banco caiu');
  });
});
