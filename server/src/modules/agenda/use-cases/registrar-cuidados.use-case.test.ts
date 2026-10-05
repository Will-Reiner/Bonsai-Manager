import { RegistrarCuidadosUseCase } from './registrar-cuidados.use-case';
import { ConclusaoRepository, RegistrarCuidadosDTO } from '../agenda.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');

describe('RegistrarCuidadosUseCase', () => {
  let repo: jest.Mocked<ConclusaoRepository>;
  let useCase: RegistrarCuidadosUseCase;

  const base: RegistrarCuidadosDTO = {
    data: AGORA.toISOString(),
    plantas: [{ plantaId: 'p1', atividadeIds: ['at-1'] }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendentesDoUsuario: jest.fn(),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      getRevisaoDias: jest.fn().mockResolvedValue(30),
      proximasPendentes: jest.fn().mockResolvedValue(new Map()),
      executar: jest.fn(),
      contarPlantasDoUsuario: jest.fn().mockResolvedValue(1),
      registrar: jest.fn().mockResolvedValue({ concluidas: [], criadas: [], revisoes: [] }),
    };
    useCase = new RegistrarCuidadosUseCase(repo);
  });
  afterEach(() => jest.useRealTimers());

  const plano = () => repo.registrar.mock.calls[0][0];

  it('registra os cuidados de cada planta com fotos, nota e obs.', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(2);

    await useCase.execute(
      {
        data: AGORA.toISOString(),
        plantas: [
          {
            plantaId: 'p1',
            atividadeIds: ['at-1', 'at-2', 'at-1'],
            detalhes: 'podei',
            observacaoFutura: 'olhar o ápice',
            fotos: [{ caminhoArquivo: 'u1', dataCaptura: '2026-10-04T10:00:00.000Z' }, { caminhoArquivo: 'u2' }],
          },
          { plantaId: 'p2', atividadeIds: ['at-2'] },
        ],
      },
      'user-1',
    );

    expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'user-1');
    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-2']);
    expect(plano().usuarioId).toBe('user-1');
    expect(plano().data).toEqual(AGORA);
    expect(plano().cuidados).toEqual([
      {
        plantaId: 'p1',
        atividadeIds: ['at-1', 'at-2'],
        detalhes: 'podei',
        observacaoFutura: 'olhar o ápice',
        fotos: [
          { caminhoArquivo: 'u1', dataCaptura: new Date('2026-10-04T10:00:00.000Z') },
          { caminhoArquivo: 'u2', dataCaptura: AGORA },
        ],
      },
      { plantaId: 'p2', atividadeIds: ['at-2'], detalhes: undefined, observacaoFutura: undefined, fotos: [] },
    ]);
  });

  it('com próximos passos, cria as pendentes e não agenda revisão', async () => {
    await useCase.execute(
      { ...base, proximos: [{ atividadeId: 'at-9', dataAgendada: '2026-11-05T12:00:00.000Z' }] },
      'user-1',
    );

    expect(repo.atividadesExistem).toHaveBeenCalledWith(['at-1', 'at-9']);
    expect(plano().criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at-9', dataAgendada: new Date('2026-11-05T12:00:00.000Z') },
    ]);
    expect(plano().revisoes).toEqual([]);
  });

  it('sem próximos, agenda a Revisão geral automática', async () => {
    await useCase.execute(base, 'user-1');

    expect(repo.proximasPendentes).toHaveBeenCalledWith(['p1'], AGORA, []);
    expect(plano().revisoes).toEqual([{ plantaId: 'p1', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });

  it('lança erro quando alguma planta não é do usuário', async () => {
    repo.contarPlantasDoUsuario.mockResolvedValue(0);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Acesso negado. A planta não pertence a si.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  it('lança erro com planta repetida', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [base.plantas[0], base.plantas[0]] }, 'user-1'),
    ).rejects.toThrow('Plantas repetidas na lista.');
  });

  it('lança erro quando uma planta fica sem cuidado', async () => {
    await expect(
      useCase.execute({ ...base, plantas: [{ plantaId: 'p1', atividadeIds: [] }] }, 'user-1'),
    ).rejects.toThrow('Informe ao menos um cuidado por planta.');
  });

  it('lança erro com atividade inexistente', async () => {
    repo.atividadesExistem.mockResolvedValue(false);

    await expect(useCase.execute(base, 'user-1')).rejects.toThrow('Atividade não encontrada.');
    expect(repo.registrar).not.toHaveBeenCalled();
  });
});
