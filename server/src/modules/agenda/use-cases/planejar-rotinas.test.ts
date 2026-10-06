import { planejarRotinas } from './planejar-rotinas';

const DATA = new Date('2026-10-05T12:00:00.000Z');

describe('planejarRotinas', () => {
  const repo = { estadoRotinas: jest.fn() };
  beforeEach(() => repo.estadoRotinas.mockReset());

  it('sem tarefas de rotina, não consulta o banco', async () => {
    expect(await planejarRotinas(repo, [{ rotinaId: null, data: DATA }], ['ag-1'])).toEqual([]);
    expect(repo.estadoRotinas).not.toHaveBeenCalled();
  });

  it('busca o estado das rotinas (sem contar as concluídas agora) e planeja a próxima', async () => {
    repo.estadoRotinas.mockResolvedValue([
      { id: 'r1', plantaId: 'p1', atividadeId: 'at', intervaloDias: 7, dataFim: null, pausada: false, temPendente: false },
    ]);

    const r = await planejarRotinas(repo, [{ rotinaId: 'r1', data: DATA }, { rotinaId: 'r1', data: DATA }], ['ag-1']);

    expect(repo.estadoRotinas).toHaveBeenCalledWith(['r1'], ['ag-1']);
    expect(r).toEqual([
      { rotinaId: 'r1', plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-10-12T12:00:00.000Z') },
    ]);
  });
});
