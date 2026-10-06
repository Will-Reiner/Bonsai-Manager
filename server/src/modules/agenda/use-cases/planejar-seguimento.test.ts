import { planejarSeguimento } from './planejar-seguimento';

describe('planejarSeguimento', () => {
  it('cria os próximos passos em cada planta', () => {
    const r = planejarSeguimento(['p1', 'p2'], [{ atividadeId: 'at', dataAgendada: '2026-11-01T12:00:00.000Z' }]);

    expect(r.criarPendentes).toEqual([
      { plantaId: 'p1', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
      { plantaId: 'p2', atividadeId: 'at', dataAgendada: new Date('2026-11-01T12:00:00.000Z') },
    ]);
    expect(r.criarRotinas).toEqual([]);
  });

  it('sem próximos, não agenda nada', () => {
    expect(planejarSeguimento(['p1'], [])).toEqual({ criarPendentes: [], criarRotinas: [] });
  });

  it('próximo com repetir vira rotina (e não pendente avulsa)', () => {
    const r = planejarSeguimento(['p1'], [
      {
        atividadeId: 'at',
        dataAgendada: '2026-11-01T12:00:00.000Z',
        repetir: { intervaloDias: 14, dataFim: '2027-03-01T12:00:00.000Z', estacoes: ['PRIMAVERA'] },
      },
      { atividadeId: 'at2', dataAgendada: '2026-11-02T12:00:00.000Z', repetir: { intervaloDias: 7 } },
    ]);

    expect(r.criarPendentes).toEqual([]);
    expect(r.criarRotinas).toEqual([
      {
        plantaId: 'p1',
        atividadeId: 'at',
        intervaloDias: 14,
        dataFim: new Date('2027-03-01T12:00:00.000Z'),
        estacoes: ['PRIMAVERA'],
        dataAgendada: new Date('2026-11-01T12:00:00.000Z'),
      },
      { plantaId: 'p1', atividadeId: 'at2', intervaloDias: 7, dataFim: null, estacoes: [], dataAgendada: new Date('2026-11-02T12:00:00.000Z') },
    ]);
  });
});
