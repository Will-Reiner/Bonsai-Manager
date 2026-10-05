import { planejarSeguimento } from './planejar-seguimento';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');

describe('planejarSeguimento', () => {
  const repo = { getRevisaoDias: jest.fn(), proximasPendentes: jest.fn() };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo.getRevisaoDias.mockReset().mockResolvedValue(30);
    repo.proximasPendentes.mockReset().mockResolvedValue(new Map());
  });
  afterEach(() => jest.useRealTimers());

  it('cria os próximos passos em cada planta e nenhuma revisão', async () => {
    const r = await planejarSeguimento(repo, {
      usuarioId: 'u',
      plantas: ['p1', 'p2'],
      proximos: [{ atividadeId: 'at', dataAgendada: '2026-11-01T12:00:00.000Z' }],
      excluir: [],
    });

    expect(r.criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
      { plantaId: 'p2', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
    ]);
    expect(r.revisoes).toEqual([]);
    expect(repo.getRevisaoDias).not.toHaveBeenCalled();
  });

  it('sem próximos, agenda revisão só para quem não tem tarefa próxima', async () => {
    repo.proximasPendentes.mockResolvedValue(new Map([['p1', new Date(AGORA.getTime() + 10 * DIA)]]));

    const r = await planejarSeguimento(repo, { usuarioId: 'u', plantas: ['p1', 'p2'], proximos: [], excluir: ['ag-1'] });

    expect(repo.proximasPendentes).toHaveBeenCalledTimes(1);
    expect(repo.proximasPendentes).toHaveBeenCalledWith(['p1', 'p2'], AGORA, ['ag-1']);
    expect(r.revisoes).toEqual([{ plantaId: 'p2', dataAgendada: new Date(AGORA.getTime() + 30 * DIA) }]);
  });

  it('revisão desligada (0 dias) não agenda nada', async () => {
    repo.getRevisaoDias.mockResolvedValue(0);

    const r = await planejarSeguimento(repo, { usuarioId: 'u', plantas: ['p1'], proximos: [], excluir: [] });

    expect(r).toEqual({ criarPendentes: [], revisoes: [] });
  });
});
